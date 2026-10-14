const query = new URLSearchParams(location.search);

export const API = query.get('api') || 'https://developer.cuevaneander.tech/.netlify/functions';
export const POLL_MS = 60 * 1000;
export const FEED_SIZE = 10;
export const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
