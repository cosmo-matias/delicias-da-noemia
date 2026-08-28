import { db } from "../client";
import { receitas, receitasInsumos, insumos, comprasItens } from "../schema";
import { eq, desc } from "drizzle-orm";
import type { Receita } from "../schema";

export const ReceitasRepository = {
  // Salvar uma receita vinculando uma lista de insumos em uma transação
  async salvarReceitaComInsumos(
    nome: string,
    rendimento: number,
    custoAdicional: number,
    observacoes: string | undefined,
    itens: {
      insumoId: number;
      quantidadeUtilizada: number;
    }[]
  ) {
    return await db.transaction(async (tx) => {
      // 1. Insere a receita principal
      const [novaReceita] = await tx
        .insert(receitas)
        .values({
          nome,
          rendimento,
          custoAdicional,
          observacoes,
        })
        .returning();

      // 2. Insere os insumos vinculados (Ficha técnica)
      if (itens.length > 0) {
        const valoresItens = itens.map((item) => ({
          receitaId: novaReceita.id,
          insumoId: item.insumoId,
          quantidadeUtilizada: item.quantidadeUtilizada,
        }));

        await tx.insert(receitasInsumos).values(valoresItens);
      }

      return novaReceita;
    });
  },

  // Obter receita e sua ficha técnica (JOIN com insumos)
  async obterReceitaPorId(id: number) {
    const receita = await db.select().from(receitas).where(eq(receitas.id, id)).get();
    if (!receita) return null;

    const itens = await db
      .select({
        id: receitasInsumos.id,
        receitaId: receitasInsumos.receitaId,
        insumoId: receitasInsumos.insumoId,
        quantidadeUtilizada: receitasInsumos.quantidadeUtilizada,
        insumoNome: insumos.nome,
        insumoMarca: insumos.marca,
        unidadeMedida: insumos.unidadeMedida,
        quantidadeMedida: insumos.quantidadeMedida, // útil para calcular o custo depois
      })
      .from(receitasInsumos)
      .innerJoin(insumos, eq(receitasInsumos.insumoId, insumos.id))
      .where(eq(receitasInsumos.receitaId, id));

    return { ...receita, insumos: itens };
  },

  // Listar receitas básicas
  async listarReceitas(): Promise<Receita[]> {
    return await db.select().from(receitas);
  },

  // Obter o último preço unitário de um insumo baseado nas compras recentes
  async obterUltimoPrecoInsumo(insumoId: number): Promise<number | null> {
    const ultimoRegistro = await db
      .select({ precoUnitario: comprasItens.precoUnitario })
      .from(comprasItens)
      .where(eq(comprasItens.insumoId, insumoId))
      .orderBy(desc(comprasItens.id))
      .limit(1)
      .get();
      
    return ultimoRegistro ? ultimoRegistro.precoUnitario : null;
  },
};
