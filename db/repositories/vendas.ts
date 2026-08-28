import { db } from "../client";
import { vendas, vendasItens, produtos } from "../schema";
import { eq } from "drizzle-orm";

export const VendasRepository = {
  // Salvar uma venda vinculando itens
  async salvarVendaComItens(
    data: string,
    custosExtras: number,
    observacoes: string | undefined,
    itens: {
      produtoId: number;
      quantidade: number;
      precoUnitario: number;
    }[]
  ) {
    return await db.transaction(async (tx) => {
      // Calcula o valor total dos itens
      const valorTotalItens = itens.reduce(
        (acc, item) => acc + item.quantidade * item.precoUnitario,
        0
      );
      
      const valorTotal = valorTotalItens + custosExtras;

      // Insere o registro principal da venda
      const [novaVenda] = await tx
        .insert(vendas)
        .values({
          data,
          valorTotal,
          custosExtras,
          observacoes,
        })
        .returning();

      // Insere os itens
      if (itens.length > 0) {
        const valoresItens = itens.map((item) => ({
          vendaId: novaVenda.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          precoTotal: item.quantidade * item.precoUnitario,
        }));

        await tx.insert(vendasItens).values(valoresItens);
      }

      return novaVenda;
    });
  },

  // Obter venda detalhada
  async obterVendaPorId(id: number) {
    const venda = await db.select().from(vendas).where(eq(vendas.id, id)).get();
    if (!venda) return null;

    const itens = await db
      .select({
        id: vendasItens.id,
        vendaId: vendasItens.vendaId,
        produtoId: vendasItens.produtoId,
        quantidade: vendasItens.quantidade,
        precoUnitario: vendasItens.precoUnitario,
        precoTotal: vendasItens.precoTotal,
        produtoNome: produtos.nome,
      })
      .from(vendasItens)
      .innerJoin(produtos, eq(vendasItens.produtoId, produtos.id))
      .where(eq(vendasItens.vendaId, id));

    return { ...venda, itens };
  },

  // Atualizar venda e seus itens
  async atualizarVendaComItens(
    id: number,
    vendaData: { data: string; custosExtras: number; observacoes?: string },
    itens: {
      produtoId: number;
      quantidade: number;
      precoUnitario: number;
    }[]
  ) {
    return await db.transaction(async (tx) => {
      // Calcula o total da venda
      const valorTotalItens = itens.reduce(
        (acc, item) => acc + item.quantidade * item.precoUnitario,
        0
      );
      const valorTotal = valorTotalItens + vendaData.custosExtras;

      // Atualiza a venda principal
      await tx
        .update(vendas)
        .set({
          data: vendaData.data,
          valorTotal,
          custosExtras: vendaData.custosExtras,
          observacoes: vendaData.observacoes,
        })
        .where(eq(vendas.id, id));

      // Deleta os itens atuais
      await tx.delete(vendasItens).where(eq(vendasItens.vendaId, id));

      // Insere a nova lista de itens
      if (itens.length > 0) {
        const valoresItens = itens.map((item) => ({
          vendaId: id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          precoTotal: item.quantidade * item.precoUnitario,
        }));
        await tx.insert(vendasItens).values(valoresItens);
      }

      return true;
    });
  },

  // Deletar venda
  async deletarVenda(id: number) {
    return await db.transaction(async (tx) => {
      await tx.delete(vendasItens).where(eq(vendasItens.vendaId, id));
      await tx.delete(vendas).where(eq(vendas.id, id));
      return true;
    });
  },

  // Listar todas as vendas (para a tela de histórico)
  async listarVendas() {
    return await db.select().from(vendas).orderBy(vendas.id);
  },
};
