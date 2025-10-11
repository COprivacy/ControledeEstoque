import PDVScanner from "../PDVScanner";

export default function PDVScannerExample() {
  return (
    <div className="p-4">
      <PDVScanner
        onSaleComplete={(sale) => console.log("Venda finalizada:", sale)}
        onProductNotFound={(barcode) => alert(`Produto não encontrado: ${barcode}`)}
      />
    </div>
  );
}
