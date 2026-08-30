import { describe, expect, it } from "vitest";
import { posicionDestino } from "./useDragReorder";

/**
 * La aritmetica del arrastre es lo unico del reordenamiento que se puede
 * equivocar en silencio: si el ajuste esta mal, el elemento cae un puesto
 * antes o despues de donde se solto y parece un problema del navegador.
 *
 * Se comprueba contra el resultado real de mover el elemento en un array,
 * que es la definicion de lo que el usuario espera ver.
 */
function moverEnArray<T>(lista: T[], from: number, to: number): T[] {
  const copia = [...lista];
  const [item] = copia.splice(from, 1);
  if (item === undefined) return copia;
  copia.splice(to, 0, item);
  return copia;
}

describe("posicionDestino", () => {
  it("soltar por arriba del primero lleva al principio", () => {
    expect(posicionDestino(3, 0, "top")).toBe(0);
  });

  it("soltar por abajo del ultimo lleva al final", () => {
    expect(posicionDestino(0, 4, "bottom")).toBe(4);
  });

  it("descuenta el hueco que deja el propio elemento al bajar", () => {
    // De la posicion 1 al borde inferior de la 3: el elemento sale primero,
    // asi que la 3 pasa a ser la 2 y el destino real es 2, no 4.
    expect(posicionDestino(1, 3, "bottom")).toBe(3);
    expect(posicionDestino(1, 3, "top")).toBe(2);
  });

  it("al subir no descuenta nada, porque no se corre lo de delante", () => {
    expect(posicionDestino(4, 1, "top")).toBe(1);
    expect(posicionDestino(4, 1, "bottom")).toBe(2);
  });

  it("soltar sobre uno mismo no mueve nada", () => {
    expect(posicionDestino(2, 2, "top")).toBe(2);
    expect(posicionDestino(2, 2, "bottom")).toBe(2);
  });

  /**
   * La comprobacion que de verdad importa: para cualquier origen, cualquier
   * destino y cualquier borde, el elemento arrastrado tiene que acabar
   * pegado al elemento sobre el que se solto, por el lado que indica el
   * borde. Si el ajuste esta mal, aqui salta.
   */
  it("el elemento acaba justo al lado de aquel sobre el que se solto", () => {
    const lista = ["a", "b", "c", "d", "e"] as const;

    for (let from = 0; from < lista.length; from += 1) {
      for (let sobre = 0; sobre < lista.length; sobre += 1) {
        if (sobre === from) continue;

        for (const edge of ["top", "bottom"] as const) {
          const to = posicionDestino(from, sobre, edge);
          const resultado = moverEnArray([...lista], from, to);

          const movido = lista[from];
          const referencia = lista[sobre];
          const posMovido = resultado.indexOf(movido!);
          const posReferencia = resultado.indexOf(referencia!);

          const esperado = edge === "bottom" ? 1 : -1;
          expect(
            posMovido - posReferencia,
            `from=${from} sobre=${sobre} edge=${edge} → ${resultado.join("")}`,
          ).toBe(esperado);
        }
      }
    }
  });
});
