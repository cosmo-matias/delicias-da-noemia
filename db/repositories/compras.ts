import { db } from "../client";
import { insumos, compras, comprasItens } from "../schema";
import { like } from "drizzle-orm";
import type { Insumo } from "../schema";

export const ComprasRepository = {
  // Cadastrar um novo insumo
  async cadastrarInsumo(
    nome: string,
    unidadeMedida: string,
    marca?: string,
    quantidadeMedida?: number,
    itensPorPacote?: number
  ) {
    const [novoInsumo] = await db
      .insert(insumos)
      .values({
        nome,
        unidadeMedida,
        marca,
        quantidadeMedida,
        itensPorPacote,
      })
      .returning();
    return novoInsumo;
  },

  // Listar insumos com suporte a busca por texto usando LIKE %nome%
  async listarInsumos(buscaNome?: string): Promise<Insumo[]> {
    if (buscaNome && buscaNome.trim().length > 0) {
      return await db
        .select()
        .from(insumos)
        .where(like(insumos.nome, `%${buscaNome}%`));
    }
    return await db.select().from(insumos);
  },

  // Salvar uma compra vinculando uma lista de itens em uma transação
  async salvarCompraComItens(
    data: string,
    observacoes: string | undefined,
    itens: {
      insumoId: number;
      quantidade: number;
      precoUnitario: number;
    }[]
  ) {
    return await db.transaction(async (tx) => {
      // 1. Calcula o total da compra
      const valorTotal = itens.reduce(
        (acc, item) => acc + item.quantidade * item.precoUnitario,
        0
      );

      // 2. Insere o registro principal da compra
      const [novaCompra] = await tx
        .insert(compras)
        .values({
          data,
          valorTotal,
          observacoes,
        })
        .returning();

      // 3. Insere os itens vinculados à compra
      if (itens.length > 0) {
        const valoresItens = itens.map((item) => ({
          compraId: novaCompra.id,
          insumoId: item.insumoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          precoTotal: item.quantidade * item.precoUnitario,
        }));

        await tx.insert(comprasItens).values(valoresItens);
      }

      return novaCompra;
    });
  },
};
