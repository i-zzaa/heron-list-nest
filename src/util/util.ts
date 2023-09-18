export enum DEVICE {
  mobile = 'mobile',
  web = 'web',
}

export type DeviceProps = 'mobile' | 'web';

export const moneyFormat = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});
