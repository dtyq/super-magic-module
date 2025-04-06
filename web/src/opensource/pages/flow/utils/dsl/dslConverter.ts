/**
 * DSL转换服务
 * 提供Flow DSL和JSON格式之间的互相转换功能
 */

import { dsl2json, jsonStr2json, json2dsl, json2dslString, jsonStr2dslString } from './converter';

/**
 * DSL转换器类
 */
export class DSLConverter {
  /**
   * 将DSL YAML字符串转换为Flow JSON对象
   * @param dslString DSL YAML字符串
   * @returns Flow JSON对象
   */
  static dslToJson(dslString: string) {
    return dsl2json(dslString);
  }

  /**
   * 将DSL YAML字符串转换为Flow JSON字符串
   * @param dslString DSL YAML字符串
   * @returns Flow JSON字符串
   */
  static dslToJsonString(dslString: string) {
    return JSON.stringify(dsl2json(dslString), null, 2);
  }

  /**
   * 将Flow JSON对象转换为DSL对象
   * @param json Flow JSON对象
   * @returns DSL对象
   */
  static jsonToDsl(json: any) {
    return json2dsl(json);
  }

  /**
   * 将Flow JSON对象转换为DSL YAML字符串
   * @param json Flow JSON对象
   * @returns DSL YAML字符串
   */
  static jsonToDslString(json: any) {
    return json2dslString(json);
  }

  /**
   * 将Flow JSON字符串转换为DSL YAML字符串
   * @param jsonString Flow JSON字符串
   * @returns DSL YAML字符串
   */
  static jsonStringToDslString(jsonString: string) {
    return jsonStr2dslString(jsonString);
  }

  /**
   * 将Flow JSON字符串转换为Flow JSON对象
   * @param jsonString Flow JSON字符串
   * @returns Flow JSON对象
   */
  static jsonStringToJson(jsonString: string) {
    return jsonStr2json(jsonString);
  }
}

export default DSLConverter; 