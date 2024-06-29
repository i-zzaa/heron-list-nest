export enum DEVICE {
  mobile = 'DEVICE_MOBILE',
  web = 'DEVICE_WEB',
}

export enum PERFIL {
  dev = 'Developer',
}

export type DeviceProps = 'DEVICE_MOBILE' | 'DEVICE_WEB';

export const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export enum TYPE_DTT {
  c = 'C',
  dt = 'DT',
  dv = 'DV',
  dg = 'DG',
  dp = 'DP',
}

export const calcAcertos = (array: string[]) => {
  const filteredArray = array.filter((item) => item !== null);

  const countC = filteredArray.filter((item) => item === TYPE_DTT.c).length;
  return ((countC / filteredArray.length) * 100).toFixed(2);
};
