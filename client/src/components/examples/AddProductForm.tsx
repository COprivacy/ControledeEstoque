import AddProductForm from "../AddProductForm";

export default function AddProductFormExample() {
  return (
    <div className="p-4 max-w-2xl">
      <AddProductForm
        onSubmit={(product) => console.log("Produto salvo:", product)}
        onCancel={() => console.log("Cancelar clicado")}
      />
    </div>
  );
}
