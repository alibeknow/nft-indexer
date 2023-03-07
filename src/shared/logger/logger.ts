import pino from 'pino';
import { IAppConfig, getAppConfig } from '@shared/baseconfig';

const appConfig: IAppConfig = getAppConfig();

const formatters = {
  level(label: string) {
    return { level: label.toUpperCase() };
  },
};

export const logger: pino.Logger = pino({
  level: appConfig.logLevel,
  formatters,
  mixinMergeStrategy(mergeObject, mixinObject) {
    return Object.assign({}, mergeObject, mixinObject);
  },
});
