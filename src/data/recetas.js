// Recetas por código de producto: insumos que usa UNA unidad completa (un trozo usa 1/4)
const r = (insumoId, cantidad) => ({ insumoId, cantidad });

export const RECETAS_DEFAULT = {
  // Tortas
  TC001: [r('harina', 300), r('huevos', 4), r('leche', 500), r('azucar', 250), r('naranjas', 3), r('crema', 300)],
  TL004: [r('chocolate', 400), r('crema', 500), r('huevos', 4), r('harina', 250), r('azucar', 200), r('mantequilla', 150)],
  TT003: [r('harina', 300), r('huevos', 6), r('leche', 750), r('azucar', 300), r('crema', 300), r('canela', 5)],
  TC002: [r('chocolate', 300), r('crema', 500), r('cerezas', 300), r('harina', 250), r('huevos', 5), r('azucar', 250)],
  TS005: [r('harina', 350), r('manjar', 600), r('huevos', 4), r('azucar', 200), r('mantequilla', 150)],
  TP006: [r('harina', 300), r('huevos', 4), r('crema', 400), r('frutillas', 300), r('azucar', 250), r('manjar', 200)],
  // Tartaletas
  TAR001: [r('harina', 250), r('mantequilla', 150), r('limones', 3), r('huevos', 3), r('azucar', 200)],
  TAR002: [r('harina', 250), r('mantequilla', 150), r('naranjas', 2), r('huevos', 3), r('azucar', 200), r('claras', 4)],
  TAR003: [r('harina', 250), r('mantequilla', 150), r('frutillas', 400), r('leche', 300), r('azucar', 150), r('huevos', 2)],
  TAR004: [r('harina', 250), r('mantequilla', 150), r('cerezas', 350), r('crema', 200), r('azucar', 150)],
  TAR005: [r('harina', 250), r('mantequilla', 150), r('manzanas', 4), r('azucar', 150), r('canela', 10)],
  // Postres
  POS007: [r('harina', 150), r('mantequilla', 80), r('chocolate', 60), r('azucar', 80), r('huevos', 1)],
  POS001: [r('harina', 150), r('mantequilla', 80), r('azucar', 90), r('huevos', 1)],
  POS002: [r('harina', 140), r('chocolate', 100), r('mantequilla', 80), r('azucar', 80), r('huevos', 1)],
  POS003: [r('crema', 150), r('frutillas', 80), r('azucar', 60), r('leche', 100)],
  POS004: [r('claras', 3), r('azucar', 150)],
  POS005: [r('frutillas', 150), r('crema', 150), r('azucar', 50)],
  POS006: [r('chocolate', 150), r('nueces', 150), r('mantequilla', 100), r('azucar', 120), r('huevos', 2), r('harina', 80)],
  TF005: [r('harina', 120), r('manjar', 100), r('huevos', 2), r('azucar', 50)],
  PI006: [r('arroz', 80), r('leche', 400), r('azucar', 60), r('canela', 3)]
};
