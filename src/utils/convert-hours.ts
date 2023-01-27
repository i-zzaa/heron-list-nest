import moment from 'moment';
import momentBusinessDays from 'moment-business-days';

moment.locale('pt-BR');

const FERIADOS = [
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

const SEMANA = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

export const formatDateTime = (hours: any, date: any) => {
  const arrTime = hours.split(':');
  return moment(date)
    .add(arrTime[0], 'hours')
    .add(arrTime[1], 'minutes')
    .format('YYYY-MM-DD HH:mm');
};

export const getPrimeiroDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes - 1, 1)).format('YYYY-MM-DD');
};

export const getUltimoDoMes = (ano: number, mes: number) => {
  return moment(new Date(ano, mes, 0)).format('YYYY-MM-DD');
};

export const getDiasDoMes = (ano: number, mes: number) => {
  const ultimoDia = moment(new Date(ano, mes, 0)).format('DD');

  const arrDatas = [];
  for (let index = 1; index <= parseInt(ultimoDia); index++) {
    const datCompleta = new Date(ano, mes, index);
    const isBusinessDay = moment(datCompleta, 'YYYY-MM-DD').isBusinessDay();

    if (isBusinessDay) {
      const format = moment(datCompleta).format('YYYY-MM-DD');
      arrDatas.push(format);
    }
  }

  return arrDatas;
};

export const formatadataPadraoBD = (date: any) => {
  const _date = new Date(date);
  return moment(_date).format('YYYY-MM-DD');
};

export const formatadataHora = (date: string, hora: string) => {
  const format = new Date(`${date}T${hora}`);
  return format;
};

export const formatdate = (date: any) => {
  const _date = new Date(date);
  const format = moment(_date).add(1, 'days');
  return moment(format).format('DD/MM/YYYY');
};

export const calculaIdade = (dataNascimento: Date) => {
  const idade = moment(dataNascimento, 'YYYYMMDD').fromNow();
  return idade.replace('há', '');
};

export const calculaData = (data1: any, data2: any) => {
  const dataAtual = moment(data1);
  const dataPassada = moment(data2);
  const diff = moment.duration(dataAtual.diff(dataPassada));

  return diff.asDays();
};

export const getFormat = (dias: number) => {
  if (!dias) return 0;

  const mes = Number((moment.duration(dias).asMonths() + 1).toFixed());
  const anos = Number((moment.duration(dias).asYears() + 1).toFixed());
  const quebraDias = dias % 30;
  const meses = dias % 365;

  let result = '';

  switch (true) {
    case dias < 30:
      return `${dias} dias`;
    case dias < 365:
      result = `${mes} mes(es)`;
      if (quebraDias !== 0) result = `${result} e ${quebraDias} dia(s)`;
      return result;
    case dias >= 365:
      result = `${anos} ano(s)`;

      if (meses !== 0) `${result} e ${meses} mes(es)`;
      if (quebraDias !== 0 && meses !== 0)
        result = `${result}, ${meses} mes(es) e ${quebraDias} dia(s)`;
      if (quebraDias !== 0 && mes === 0)
        result = `${result} e ${quebraDias} dia(s)`;
      return result;
  }
};
