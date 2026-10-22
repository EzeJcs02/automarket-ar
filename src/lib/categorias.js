// Categorías de vehículo con su ícono. Fuente única para Home, hero y filtros.
export const CATEGORIAS = {
  autos: [
    { tipo: 'SUV', img: '/img/tipos/icon_suv.webp' },
    { tipo: 'Hatchback', img: '/img/tipos/icon_hatchback.webp' },
    { tipo: 'Sedán', img: '/img/tipos/icon_sedan.webp' },
    { tipo: 'Pickup', img: '/img/tipos/icon_pickup.webp' },
    { tipo: 'Minivan', img: '/img/tipos/icon_minivan.webp' },
    { tipo: 'Coupé', img: '/img/tipos/icon_coupe.webp' },
  ],
  motos: [
    { tipo: 'Naked', img: '/img/tipos/icon_moto_naked.webp' },
    { tipo: 'Deportiva', img: '/img/tipos/icon_moto_deportiva.webp' },
    { tipo: 'Touring', img: '/img/tipos/icon_moto_touring.webp' },
    { tipo: 'Scooter', img: '/img/tipos/icon_moto_scooter.webp' },
    { tipo: 'Enduro', img: '/img/tipos/icon_moto_enduro.webp' },
    { tipo: 'Custom', img: '/img/tipos/icon_moto_custom.webp' },
  ],
  nautica: [
    { tipo: 'Lancha', img: '/img/tipos/icon_nautica_lancha.webp' },
    { tipo: 'Velero', img: '/img/tipos/icon_nautica_velero.webp' },
    { tipo: 'Yate', img: '/img/tipos/icon_nautica_yate.webp' },
    { tipo: 'Moto de Agua', img: '/img/tipos/icon_nautica_motoagua.webp' },
    { tipo: 'Semi-rígido', img: '/img/tipos/icon_nautica_semirigido.webp' },
  ],
}

export const GRUPOS = [['autos', 'Autos'], ['motos', 'Motos'], ['nautica', 'Náutica']]

// Topes de precio rápidos para el buscador del hero (ARS)
export const PRECIOS_MAX = [5_000_000, 10_000_000, 20_000_000, 35_000_000, 50_000_000, 80_000_000]
