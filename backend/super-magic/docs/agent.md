# Agent

- agent 的数据结构在文件 app/agent/super_magic.py 中定义，里面包含了 agent 的核心逻辑

## 生命周期

每次用户发送一条chat消息，就会创建一个agent，agent 会根据用户的消息，生成对应的任务，然后拆解为多个步骤，agent 会循环执行这些步骤，直到完成任务。任务完成之后，agent的生命周期结束。

## agent context

agent context 存放了 agent 的上下文信息，是和 agent 生命周期绑定的。

- agent context 的数据结构在文件 app/core/context/agent_context.py 中定义

## 多agent

本项目采取了多agent的设计，每个agent都是从 SuperMagic 创建出来的，它们唯一的不同就是系统提示词不同。
