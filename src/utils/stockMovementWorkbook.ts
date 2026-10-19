import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import type { StockMovement } from "@/types/product";

type MovementType = StockMovement["type"];
const movementLabel: Record<MovementType, string> = {
  IN: "Stok masuk",
  OUT: "Stok keluar",
  ADJUSTMENT: "Adjustment",
};
const positive = { font: { color: { argb: "FF00854A" }, bold: true } };
const negative = { font: { color: { argb: "FFB42318" }, bold: true } };
const header = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: {
    type: "pattern" as const,
    pattern: "solid" as const,
    fgColor: { argb: "FF24364B" },
  },
  alignment: {
    vertical: "middle" as const,
    horizontal: "center" as const,
    wrapText: true,
  },
};

export async function downloadStockMovementTemplate(
  movements: StockMovement[],
  rangeLabel: string,
) {
  const response = await fetch("/Template_Stock_Movement.xlsx");
  if (!response.ok)
    throw new Error(
      "Template_Stock_Movement.xlsx belum tersedia di frontend/public.",
    );
  const workbook = new ExcelJS.Workbook();
  workbook.calcProperties.fullCalcOnLoad = true;
  await workbook.xlsx.load(await response.arrayBuffer());
  const master = workbook.getWorksheet("Master Produk");
  const input = workbook.getWorksheet("Input Movement");
  const summary = workbook.getWorksheet("Ringkasan Stok");
  const guide = workbook.getWorksheet("Petunjuk");
  if (!master || !input || !summary)
    throw new Error("Struktur sheet template tidak sesuai.");
  const columnsOf = (sheet: ExcelJS.Worksheet) => {
    const result = new Map<string, number>();
    sheet
      .getRow(1)
      .eachCell((cell, column) =>
        result.set(String(cell.value ?? "").trim(), column),
      );
    return result;
  };
  const movementColumns = columnsOf(input);
  const masterColumns = columnsOf(master);
  const required = [
    "ID Movement",
    "Tanggal",
    "Jenis",
    "Produk",
    "SKU",
    "Jumlah Perubahan",
    "Stok Sebelum",
    "Stok Sesudah",
    "Catatan",
    "Petugas",
    "Validasi",
  ];
  if (
    required.some((name) => !movementColumns.has(name)) ||
    ["SKU", "Produk", "Stok Awal"].some((name) => !masterColumns.has(name))
  )
    throw new Error(
      "Header pada template tidak sesuai dengan format yang diharapkan.",
    );
  const skuColumn = masterColumns.get("SKU")!;
  const nameColumn = masterColumns.get("Produk")!;
  const openingColumn = masterColumns.get("Stok Awal")!;
  const masterRows = new Map<string, number>();
  master.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const sku = String(row.getCell(skuColumn).value ?? "").trim();
      if (sku) masterRows.set(sku, rowNumber);
    }
  });
  const ordered = movements
    .filter((movement) => movement.product?.sku)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime() ||
        a.id - b.id,
    );
  const bySku = new Map<string, StockMovement[]>();
  for (const movement of ordered) {
    const sku = movement.product!.sku;
    bySku.set(sku, [...(bySku.get(sku) ?? []), movement]);
  }
  for (const [sku, skuMovements] of bySku) {
    if (masterRows.has(sku)) continue;
    const product = skuMovements[0].product!;
    const rowNumber = Math.max(master.rowCount + 1, 2);
    const net = skuMovements.reduce(
      (sum, movement) =>
        sum +
        (movement.type === "OUT"
          ? -Math.abs(movement.quantity)
          : movement.quantity),
      0,
    );
    const row = master.getRow(rowNumber);
    row.getCell(skuColumn).value = sku;
    row.getCell(nameColumn).value = product.name;
    row.getCell(openingColumn).value = Number(product.stock) - net;
    masterRows.set(sku, rowNumber);
  }
  const col = Object.fromEntries(
    required.map((name) => [name, movementColumns.get(name)!]),
  ) as Record<(typeof required)[number], number>;
  const firstRow = 2;
  for (
    let rowNumber = firstRow;
    rowNumber <= Math.max(input.rowCount, firstRow + ordered.length - 1);
    rowNumber++
  )
    input.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell) => {
      cell.value = null;
    });
  const previous = new Map<string, number>();
  ordered.forEach((movement, index) => {
    const rowNumber = firstRow + index;
    const row = input.getRow(rowNumber);
    const product = movement.product!;
    const sku = product.sku;
    const delta =
      movement.type === "OUT"
        ? -Math.abs(movement.quantity)
        : movement.quantity;
    const before =
      Number(
        master.getRow(masterRows.get(sku)!).getCell(openingColumn).value ?? 0,
      ) + (previous.get(sku) ?? 0);
    const after = before + delta;
    row.getCell(col["ID Movement"]).value = movement.id;
    row.getCell(col.Tanggal).value = new Date(movement.created_at);
    row.getCell(col.Tanggal).numFmt = "dd/mm/yyyy hh:mm";
    row.getCell(col.Jenis).value = movementLabel[movement.type];
    row.getCell(col.Produk).value = product.name;
    row.getCell(col.SKU).value = sku;
    row.getCell(col["Jumlah Perubahan"]).value = delta;
    row.getCell(col["Jumlah Perubahan"]).font =
      delta < 0 ? negative.font : positive.font;
    row.getCell(col["Stok Sebelum"]).value = before;
    row.getCell(col["Stok Sesudah"]).value = after;
    row.getCell(col.Catatan).value = movement.note ?? "";
    row.getCell(col.Petugas).value = movement.user?.name ?? "";
    row.getCell(col.Validasi).value =
      after < 0
        ? "Stok negatif"
        : movement.type === "IN" && delta <= 0
          ? "Stok masuk harus positif"
          : movement.type === "OUT" && delta >= 0
            ? "Stok keluar harus negatif"
            : "OK";
    row.getCell(col.Validasi).font =
      after < 0 ? negative.font : { color: { argb: "FF00854A" } };
    previous.set(sku, (previous.get(sku) ?? 0) + delta);
  });
  input.autoFilter = {
    from: { row: 1, column: 1 },
    to: {
      row: Math.max(1, firstRow + ordered.length - 1),
      column: input.columnCount,
    },
  };
  input.views = [{ state: "frozen", ySplit: 1 }];
  input.getColumn(col.Tanggal).width = 21;
  input.getColumn(col.Produk).width = 28;
  input.getColumn(col.SKU).width = 16;
  input.getColumn(col.Catatan).width = 34;
  input.getColumn(col.Petugas).width = 20;
  const summaryColumns = [
    "SKU",
    "Produk",
    "Stok Awal",
    "Total Masuk",
    "Total Keluar",
    "Total Adjustment",
    "Stok Akhir",
  ];
  summary.spliceRows(1, summary.rowCount);
  summary.addRow(summaryColumns);
  summary.getRow(1).eachCell((cell) => {
    cell.style = header;
  });
  for (const sku of [...masterRows.keys()].sort((a, b) =>
    a.localeCompare(b, "id"),
  )) {
    const masterRow = master.getRow(masterRows.get(sku)!);
    const skuMovements = bySku.get(sku) ?? [];
    const totalIn = skuMovements
      .filter((movement) => movement.type === "IN")
      .reduce((sum, movement) => sum + movement.quantity, 0);
    const totalOut = skuMovements
      .filter((movement) => movement.type === "OUT")
      .reduce((sum, movement) => sum + Math.abs(movement.quantity), 0);
    const totalAdjustment = skuMovements
      .filter((movement) => movement.type === "ADJUSTMENT")
      .reduce((sum, movement) => sum + movement.quantity, 0);
    const opening = Number(masterRow.getCell(openingColumn).value ?? 0);
    summary.addRow([
      sku,
      masterRow.getCell(nameColumn).value,
      opening,
      totalIn,
      totalOut,
      totalAdjustment,
      opening + totalIn - totalOut + totalAdjustment,
    ]);
  }
  summary.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, summary.rowCount), column: summaryColumns.length },
  };
  summary.views = [{ state: "frozen", ySplit: 1 }];
  summary.getColumn(2).width = 28;
  if (guide) {
    const row = guide.getRow(guide.rowCount + 1);
    row.getCell(1).value =
      `Ekspor aplikasi: ${rangeLabel}. Seluruh data pada filter aktif disertakan; stok awal SKU yang belum ada di master direkonstruksi dari pergerakan yang diekspor.`;
    row.getCell(1).alignment = { wrapText: true, vertical: "top" };
  }
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `riwayat-stok-${rangeLabel.replaceAll("/", "-").replaceAll(" ", "_")}.xlsx`,
  );
}
