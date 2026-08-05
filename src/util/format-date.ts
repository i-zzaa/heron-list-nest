import * as moment from 'moment';
import * as momentBusinessDays from 'moment-business-days';

export const FERIADOS = [
  '01-01-2022',
  '21-04-2022',
  '01-05-2022',
  '16-06-2022',
  '07-09-2022',
  '12-10-2022',
  '02-11-2022',
  '15-11-2022',
  '25-12-2022',
];
momentBusinessDays.updateLocale('pt', {
  holidays: FERIADOS,
  holidayFormat: 'YYYY-MM-DD',
  workingWeekdays: [1, 2, 3, 4, 5, 6],
});

moment.locale('pt-BR');

export const momentBusiness = momentBusinessDays;

export const weekDay = [
  'Segunda-feira',
  'Terca-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const HOURS = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export const dateFormatYYYYMMDD = (date: Date | string) =>
  moment(date).format('YYYY-MM-DD');

export const dateFormatDDMMYYYY = (date: Date | string) =>
  moment(date).format('DD/MM/YYYY');

export const dateFormatDDMMYYYYHHMM = (date: Date | string) =>
  moment(date).format('DD/MM/YYYY HH:mm');

export function getDatesBetween(start: string, end: string) {
  const datas: string[] = [];
  const dataAtual = moment(start, 'YYYY-MM-DD').startOf('day');
  const dataFim = moment(end, 'YYYY-MM-DD').startOf('day');

  while (dataAtual.isSameOrBefore(dataFim)) {
    datas.push(dataAtual.format('YYYY-MM-DD'));
    dataAtual.add(1, 'day');
  }

  return datas;
}

export function getDates(
  diasDaSemana: string[],
  startDate: string,
  endDate: string,
  intervaloSemana: number = 1,
  deleteDates: string[],
) {
  const datas: string[] = [];
  const start = moment(startDate, 'YYYY-MM-DD').startOf('day');
  const end = moment(endDate, 'YYYY-MM-DD').startOf('day');
  const skipDates = new Set(
    (deleteDates || []).map((d: string) => moment(d).format('YYYY-MM-DD')),
  );
  const normalizedInterval =
    Number(intervaloSemana) > 0 ? Number(intervaloSemana) : 1;

  const weekDays = (diasDaSemana || [])
    .map((day: string) => {
      const parsed = Number(day);

      if (Number.isNaN(parsed)) {
        return null;
      }

      // Dias salvos no banco usam ISO weekday: 1-7 (segunda-domingo).
      if (parsed >= 1 && parsed <= 7) {
        return parsed;
      }

      // Compatibilidade com payloads antigos em 0-6 (domingo-sabado).
      if (parsed >= 0 && parsed <= 6) {
        return parsed === 0 ? 7 : parsed;
      }

      return null;
    })
    .filter((day): day is number => day !== null);

  const dataAtual = start.clone();

  while (dataAtual.isSameOrBefore(end)) {
    const diffDays = dataAtual.diff(start, 'days');
    const weekOffset = Math.floor(diffDays / 7);
    const isOnIntervalWeek = weekOffset % normalizedInterval === 0;
    const isMatchingWeekday =
      weekDays.length === 0 || weekDays.includes(dataAtual.isoWeekday());
    const dateFormatted = dataAtual.format('YYYY-MM-DD');

    if (isOnIntervalWeek && isMatchingWeekday && !skipDates.has(dateFormatted)) {
      datas.push(dateFormatted);
    }

    dataAtual.add(1, 'day');
  }

  return datas;
}

export function horaEstaEntre(hora: string, horaInicio: string) {
  const horaObj = moment(hora, 'HH:mm').subtract(30, 'minute');
  const horaFimObj = moment(hora, 'HH:mm').add(1, 'hours');

  const horaInicioObj = moment(horaInicio, 'HH:mm');

  return horaInicioObj.isBetween(horaObj, horaFimObj);
}

export const formatDateTime = (hours: any, date: any) => {
  const arrTime = hours.split(':');
  return moment(date)
    .add(arrTime[0], 'hours')
    .add(arrTime[1], 'minutes')
    .format('YYYY-MM-DD HH:mm');
};

export const formatDateHours = (hours: any, date: any) => {
  const arrTime = hours.split(':');
  return moment(date)
    .add(arrTime[0], 'hours')
    .add(arrTime[1], 'minutes')
    .format('DD/MM/YY HH:mm');
};

export const dateSubtractDay = (date: string, subDay: number) => {
  return moment(date).subtract(subDay, 'days').format('YYYY-MM-DD');
};
export const dateAddtDay = (date: string, subDay: number) => {
  return moment(date).add(subDay, 'days').format('YYYY-MM-DD');
};

export const getPrimeiroDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes - 1, 1)).format('YYYY-MM-DD');
};

export const getUltimoDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes, 0)).format('YYYY-MM-DD');
};

export const formatadataPadraoBD = (date: any) => {
  const _date = new Date(date);
  return moment(_date).format('YYYY-MM-DD');
};

export const transformStringInDate = (date: string) => moment(date);

export const calculaData = (data1: any, data2: any) => {
  const dataAtual = moment(data1);
  const dataPassada = moment(data2);
  const diff = moment.duration(dataAtual.diff(dataPassada));

  return diff.asDays();
};

export const calculaIdade = (dataNascimento: string) => {
  const idade = moment(dataNascimento, 'YYYYMMDD').fromNow();
  return idade.replace('há', '');
};

export const dateBetween = (
  dateAtual: string,
  datatPesquisaFim: string,
  dataPesquisaInicio: string,
) => {
  const date = moment(dateAtual).format('YYYY-MM-DD');

  const inicioDoMes = moment(dataPesquisaInicio).format('YYYY-MM-DD');
  const fimDoMes = moment(datatPesquisaFim).format('YYYY-MM-DD');

  return date >= inicioDoMes && date <= fimDoMes;
};

export function getDatesWhiteEvents(
  diasDaSemana: string[],
  startDate: string,
  endDate: string,
  intervaloSemana: number = 1,
  events: any,
) {
  const arrEvents: any[] = [];
  const datas = getDates(
    diasDaSemana,
    startDate,
    endDate,
    intervaloSemana,
    [],
  );

  datas.forEach((dataInicio: string) => {
    arrEvents.push({
      ...events,
      dataInicio,
      dataFim: moment(dataInicio).add(1, 'days').format('YYYY-MM-DD'),
    });
  });

  return arrEvents;
}

export const formaTime = (duration: any) => {
  const safeDuration =
    duration && typeof duration.hours === 'function'
      ? duration
      : moment.duration(duration || 0);

  return `${safeDuration.hours().toString().padStart(2, '0')}:${safeDuration
    .minutes()
    .toString()
    .padStart(2, '0')}:${safeDuration.seconds().toString().padStart(2, '0')}`;
};

export const getDateBeforeDay = (days: number) => {
  return momentBusinessDays().businessAdd(days).format('YYYY-MM-DD');
};

export const calcHoursHHMM = (hora1, hora2, format = 'HH:mm') => {
  // Converter as horas em objetos Moment
  const momento1 = moment(hora1, format);
  const momento2 = moment(hora2, format);

  // Calcular a diferença de horas
  const diferencaHoras = moment.duration(momento2.diff(momento1));

  // Formatar o resultado para "HH:MM"
  const horaFormatada = moment
    .utc(diferencaHoras.asMilliseconds())
    .format(format);

  return horaFormatada;
};
