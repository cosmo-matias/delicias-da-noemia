import { db } from "../client";
import { produtos, receitas } from "../schema";
import { eq } from "drizzle-orm";
import type { Produto } from "../schema";

export const ProdutosRepository = {
  async salvarProduto(nome: string, precoVenda: number, receitaId?: number, observacoes?: string) {
    const [novoProduto] = await db
      .insert(produtos)
      .values({
        nome,
        precoVenda,
        receitaId: receitaId || null,
        observacoes,
      })
      .returning();
    return novoProduto;
  },

  async atualizarProduto(id: number, dados: { nome: string; precoVenda: number; receitaId?: number; observacoes?: string }) {
    await db
      .update(produtos)
      .set({
        nome: dados.nome,
        precoVenda: dados.precoVenda,
        receitaId: dados.receitaId || null,
        observacoes: dados.observacoes,
      })
      .where(eq(produtos.id, id));
    return true;
  },

  async deletarProduto(id: number) {
    await db.delete(produtos).where(eq(produtos.id, id));
    return true;
  },

  async listarProdutos() {
    const resultados = await db
      .select({
        id: produtos.id,
        nome: produtos.nome,
        precoVenda: produtos.precoVenda,
        receitaId: produtos.receitaId,
        observacoes: produtos.observacoes,
        receitaNome: receitas.nome,
      })
      .from(produtos)
      .leftJoin(receitas, eq(produtos.receitaId, receitas.id));
    return resultados;
  },

  async obterProdutoPorId(id: number) {
    const resultado = await db
      .select({
        id: produtos.id,
        nome: produtos.nome,
        precoVenda: produtos.precoVenda,
        receitaId: produtos.receitaId,
        observacoes: produtos.observacoes,
        receitaNome: receitas.nome,
        receitaRendimento: receitas.rendimento,
      })
      .from(produtos)
      .leftJoin(receitas, eq(produtos.receitaId, receitas.id))
      .where(eq(produtos.id, id))
      .get();
      
    return resultado || null;
  },
};
