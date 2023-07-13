import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

export function formatDate(inputDateTime: any) {
  const dataUTC = utcToZonedTime(new Date(inputDateTime), 'UTC');
  const dataFormatada = format(dataUTC, 'dd/MM/yyyy HH:mm');

  return dataFormatada;
}
