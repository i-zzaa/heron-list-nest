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
  // Defina a data de início e a data final como objetos moment
  const startDate = momentBusinessDays(start);
  const endDate = momentBusinessDays(end).add(1, 'days');

  // Obtenha todas as datas úteis entre a data de início e a data final usando o método businessDates

  const datasUteis = [];
  const diff = endDate.businessDiff(startDate);
  for (let index = 0; index <= diff; index++) {
    datasUteis.push(startDate.businessAdd(index).format('YYYY-MM-DD'));
  }

  // Imprima as datas úteis
  // console.log('Datas úteis:', datasUteis);
  return datasUteis;
}

export function getDates(
  diasDaSemana: string[],
  startDate: string,
  endDate: string,
  intervaloSemana: number = 1,
  deleteDates: string[],
) {
  // Crie uma matriz para armazenar as datas
  let datas: string[] = [];

  // console.log(startDate, endDate);
  // Defina a data de início e a data final como objetos moment
  const start = momentBusinessDays(startDate); //.subtract(1);
  const end = momentBusinessDays(endDate);
  // const end = momentBusinessDays(endDate).add(1, 'days');

  // Defina um objeto moment para a próxima ocorrência do dia da semana especificado após a data de início
  let dataAtual = start;

  // Itere enquanto a data atual for menor ou igual à data final
  while (dataAtual.isSameOrBefore(end)) {
    // Adicione a data atual à matriz de datas

    if (diasDaSemana.length) {
      let diasPercorridos = 1;
      diasDaSemana.map((day: string) => {
        if (parseInt(day) == dataAtual.day()) {
          datas.push(dataAtual.format('YYYY-MM-DD'));
          dataAtual.nextBusinessDay();
          diasPercorridos++;
        }
      });

      if (diasPercorridos > 1) dataAtual.businessSubtract(diasPercorridos - 1);
    } else {
      datas.push(dataAtual.format('YYYY-MM-DD'));
    }

    switch (intervaloSemana) {
      case 1:
        dataAtual = dataAtual.businessAdd(4);
        break;
      case 2:
        dataAtual = dataAtual.businessAdd(10);
        break;
      case 3:
        dataAtual = dataAtual.businessAdd(15);
        break;
    }
  }

  // Retorne a matriz de datas
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
  // Crie uma matriz para armazenar as datas
  let arrEvents: string[] = [];

  // console.log(startDate, endDate);
  // Defina a data de início e a data final como objetos moment
  const start = momentBusinessDays(startDate);
  const end = momentBusinessDays(endDate);

  // Defina um objeto moment para a próxima ocorrência do dia da semana especificado após a data de início
  let dataAtual = start;

  // Itere enquanto a data atual for menor ou igual à data final
  while (dataAtual.isSameOrBefore(end)) {
    // Adicione a data atual à matriz de datas

    const dataFim = moment(dataAtual).add(1, 'days').format('YYYY-MM-DD');
    const newEvents = {
      ...events,
      dataInicio: dataAtual.format('YYYY-MM-DD'),
      dataFim,
    };

    if (diasDaSemana.length) {
      let diasPercorridos = 0;
      diasDaSemana.map((day: string) => {
        if (parseInt(day) == dataAtual.day()) {
          arrEvents.push(newEvents);
          dataAtual.nextBusinessDay();
          diasPercorridos++;
        }
      });

      if (diasPercorridos > 1) dataAtual.businessSubtract(diasPercorridos);
    } else {
      arrEvents.push(newEvents);
    }

    switch (intervaloSemana) {
      case 1:
        dataAtual = dataAtual.businessAdd(5);
        break;
      case 2:
        dataAtual = dataAtual.businessAdd(10);
        break;
      case 3:
        dataAtual = dataAtual.businessAdd(15);
        break;
    }
  }

  // Retorne a matriz de datas
  return arrEvents;
}

export const formaTime = (duration: any) => {
  return `${duration.hours().toString().padStart(2, '0')}:${duration
    .minutes()
    .toString()
    .padStart(2, '0')}:${duration.seconds().toString().padStart(2, '0')}`;
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
