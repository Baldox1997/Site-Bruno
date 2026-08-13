export type WorkflowStep = {
  id: string;
  label: string;
  done: boolean;
};

export function calcPublicWorkflow(opts: {
  selfieDone?: boolean;
  cartCount: number;
  photosFound: number;
}): WorkflowStep[] {
  return [
    { id: "selfie", label: "Enviar selfie", done: !!opts.selfieDone },
    { id: "find", label: "Encontrar fotos", done: opts.photosFound > 0 },
    { id: "cart", label: "Adicionar ao carrinho", done: opts.cartCount > 0 },
    { id: "buy", label: "Finalizar compra", done: false },
  ];
}

export function workflowProgress(steps: WorkflowStep[]): number {
  if (!steps.length) return 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}
