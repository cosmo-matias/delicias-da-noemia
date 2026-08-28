import { db } from "../client";
import { compras, comprasItens, insumos, vendas, vendasItens, produtos } from "../schema";
import { eq, gte, lte, and, sum } from "drizzle-orm";

export const DashboardRepository = {
  async obterDadosVisaoGeral(dataInicio: string, dataFim: string) {
    // Total Gasto em Compras
    const [comprasRow] = await db
      .select({ total: sum(compras.valorTotal) })
      .from(compras)
      .where(and(gte(compras.data, dataInicio), lte(compras.data, dataFim)));
    
    const totalCompras = Number(comprasRow?.total || 0);

    // Total Arrecadado em Vendas
    const [vendasRow] = await db
      .select({ total: sum(vendas.valorTotal) })
      .from(vendas)
      .where(and(gte(vendas.data, dataInicio), lte(vendas.data, dataFim)));
    
    const totalVendas = Number(vendasRow?.total || 0);

    // Detalhamento de Insumos (Agrupado)
    const insumosRaw = await db
      .select({
        nome: insumos.nome,
        totalGasto: sum(comprasItens.precoTotal),
      })
      .from(comprasItens)
      .innerJoin(compras, eq(comprasItens.compraId, compras.id))
      .innerJoin(insumos, eq(comprasItens.insumoId, insumos.id))
      .where(and(gte(compras.data, dataInicio), lte(compras.data, dataFim)))
      .groupBy(insumos.id, insumos.nome);

    const detalhamentoInsumos = insumosRaw
      .map(item => ({
        nome: item.nome,
        totalGasto: Number(item.totalGasto || 0),
      }))
      .sort((a, b) => b.totalGasto - a.totalGasto);

    // Detalhamento de Produtos (Agrupado)
    const produtosRaw = await db
      .select({
        nome: produtos.nome,
        totalArrecadado: sum(vendasItens.precoTotal),
      })
      .from(vendasItens)
      .innerJoin(vendas, eq(vendasItens.vendaId, vendas.id))
      .innerJoin(produtos, eq(vendasItens.produtoId, produtos.id))
      .where(and(gte(vendas.data, dataInicio), lte(vendas.data, dataFim)))
      .groupBy(produtos.id, produtos.nome);

    const detalhamentoProdutos = produtosRaw
      .map(item => ({
        nome: item.nome,
        totalArrecadado: Number(item.totalArrecadado || 0),
      }))
      .sort((a, b) => b.totalArrecadado - a.totalArrecadado);

    return {
      totalCompras,
      totalVendas,
      detalhamentoInsumos,
      detalhamentoProdutos,
    };
  },
};
