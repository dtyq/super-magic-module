/**
 * DSL工具索引文件
 * 导出所有与DSL相关的工具函数和类型
 */

import nodeMapping from './nodeMapping';
import { dsl2json, jsonStr2json, json2dsl, json2dslString, jsonStr2dslString } from './converter';
import { DSLConverter } from './dslConverter';

// 导出所有DSL相关工具
export {
  // 节点映射
  nodeMapping,
  
  // DSL转换相关
  dsl2json,
  jsonStr2json,
  json2dsl,
  json2dslString,
  jsonStr2dslString,
  
  // DSL转换器类
  DSLConverter
};

// 导出默认接口
export default {
  nodeMapping,
  dsl2json,
  jsonStr2json,
  json2dsl,
  json2dslString,
  jsonStr2dslString,
  DSLConverter
}; 