"use client";

import { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";

/**
 * Reordenar listas arrastrando.
 *
 * El panel ordena bloques, imagenes y servicios con botones de subir y bajar.
 * Funcionan, pero mover la foto 20 al primer puesto son diecinueve clics, y en
 * una galeria de obra eso pasa constantemente.
 *
 * Los botones NO desaparecen: son la via accesible con teclado y con lector de
 * pantalla, y arrastrar no lo es. El arrastre se anade encima para quien usa
 * raton, que es el caso mayoritario aqui.
 *
 * Se usa pragmatic-drag-and-drop porque va sobre la API nativa de arrastre del
 * navegador: no monta un `mousemove` global ni clona nodos, asi que no pelea
 * con el scroll ni con los formularios que hay dentro de cada tarjeta.
 *
 * Uso:
 *
 *   const { itemRef, dragState } = useDragReorder(list.length, mover);
 *   <li ref={itemRef(index)} data-arrastrando={dragState(index).dragging}>
 *
 * `onReorder(from, to)` recibe indices ya normalizados: `to` es la posicion
 * final en la lista, no el borde sobre el que se solto.
 */

/**
 * Traduce "solte sobre el borde X del elemento N" a "la posicion final es M".
 *
 * Tiene mas miga de la que parece: el borde dice a que lado del elemento cae,
 * pero al sacar primero el elemento arrastrado de la lista, todo lo que estaba
 * detras de el se desplaza una posicion. Si no se descuenta, arrastrar hacia
 * abajo deja el elemento siempre un puesto antes de donde se solto.
 *
 * Se exporta aparte, sin DOM de por medio, porque es la parte facil de
 * equivocar y la unica que se puede probar sin navegador.
 */
export function posicionDestino(from: number, sobre: number, edge: Edge): number {
  const bruta = edge === "bottom" ? sobre + 1 : sobre;
  return from < bruta ? bruta - 1 : bruta;
}

export interface DragItemState {
  /** El elemento que el usuario esta arrastrando ahora mismo. */
  dragging: boolean;
  /** Borde por el que entraria el elemento soltado, para pintar la guia. */
  edge: Edge | null;
}

const ESTADO_QUIETO: DragItemState = { dragging: false, edge: null };

export function useDragReorder(
  length: number,
  onReorder: (from: number, to: number) => void,
) {
  // El mapa va de elemento a indice, y NO al reves. Al reordenar sin cambiar
  // el numero de elementos, React conserva los mismos nodos (las claves son
  // estables) y solo los recoloca: el efecto no se vuelve a montar, asi que si
  // el indice viviera dentro de la clausura de `draggable` se quedaria con el
  // valor viejo y el segundo arrastre moveria el elemento equivocado. Guardado
  // asi, cada arrastre consulta el indice vigente en ese momento.
  const elementos = useRef(new Map<HTMLElement, number>());
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [target, setTarget] = useState<{ index: number; edge: Edge } | null>(
    null,
  );

  // `onReorder` suele venir como funcion nueva en cada render. Se guarda en una
  // ref para que el efecto no se vuelva a montar y cancele un arrastre en curso.
  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const itemRef = (index: number) => (element: HTMLElement | null) => {
    if (element) elementos.current.set(element, index);
  };

  /** Indice que ocupa el elemento ahora, no cuando se registro. */
  const indiceDe = (element: Element): number =>
    elementos.current.get(element as HTMLElement) ?? -1;

  useEffect(() => {
    // Los nodos que React ya ha desmontado se quedarian en el mapa para
    // siempre: el callback de ref no dice cual se fue, solo que hubo un null.
    for (const element of [...elementos.current.keys()]) {
      if (!element.isConnected) elementos.current.delete(element);
    }

    const registrados = [...elementos.current.keys()];
    if (registrados.length === 0) return;

    const limpiezas = registrados.map((element) =>
      combine(
        draggable({
          element,
          getInitialData: () => ({ dragReorderIndex: indiceDe(element) }),
          onDragStart: () => setDraggingIndex(indiceDe(element)),
          onDrop: () => setDraggingIndex(null),
        }),
        dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            typeof source.data.dragReorderIndex === "number",
          getData: ({ input }) =>
            attachClosestEdge(
              { dragReorderIndex: indiceDe(element) },
              { input, element, allowedEdges: ["top", "bottom"] },
            ),
          onDrag: ({ self, source }) => {
            const index = indiceDe(element);
            const edge = extractClosestEdge(self.data);
            if (!edge || source.data.dragReorderIndex === index) {
              setTarget(null);
              return;
            }
            setTarget({ index, edge });
          },
          onDragLeave: () => setTarget(null),
          onDrop: () => setTarget(null),
        }),
      ),
    );

    limpiezas.push(
      monitorForElements({
        canMonitor: ({ source }) =>
          typeof source.data.dragReorderIndex === "number",
        onDrop: ({ source, location }) => {
          setDraggingIndex(null);
          setTarget(null);

          const from = source.data.dragReorderIndex;
          const destino = location.current.dropTargets[0];
          if (typeof from !== "number" || !destino) return;

          const sobre = destino.data.dragReorderIndex;
          const edge = extractClosestEdge(destino.data);
          if (typeof sobre !== "number" || !edge) return;

          const to = posicionDestino(from, sobre, edge);
          if (to === from || to < 0 || to >= length) return;
          onReorderRef.current(from, to);
        },
      }),
    );

    return combine(...limpiezas);
  }, [length]);

  const dragState = (index: number): DragItemState => {
    if (draggingIndex === index) return { dragging: true, edge: null };
    if (target?.index === index) return { dragging: false, edge: target.edge };
    return ESTADO_QUIETO;
  };

  return { itemRef, dragState, isDragging: draggingIndex !== null };
}
