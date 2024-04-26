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
