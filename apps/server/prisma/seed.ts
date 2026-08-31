import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const js = await prisma.knowledgePoint.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'JavaScript', sortOrder: 1 },
  });

  const ts = await prisma.knowledgePoint.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'TypeScript', sortOrder: 2 },
  });

  const vue = await prisma.knowledgePoint.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Vue', sortOrder: 3 },
  });

  const react = await prisma.knowledgePoint.upsert({
    where: { id: 4 },
    update: {},
    create: { name: 'React', sortOrder: 4 },
  });

  const algorithm = await prisma.knowledgePoint.upsert({
    where: { id: 5 },
    update: {},
    create: { name: '算法', sortOrder: 5 },
  });

  const network = await prisma.knowledgePoint.upsert({
    where: { id: 6 },
    update: {},
    create: { name: '网络', sortOrder: 6 },
  });

  const highFreq = await prisma.tag.upsert({
    where: { id: 1 },
    update: {},
    create: { name: '高频', color: '#ef4444' },
  });

  const handwritten = await prisma.tag.upsert({
    where: { id: 2 },
    update: {},
    create: { name: '手写题', color: '#f59e0b' },
  });

  const bytedance = await prisma.tag.upsert({
    where: { id: 3 },
    update: {},
    create: { name: '字节', color: '#3b82f6' },
  });

  await prisma.question.createMany({
    data: [
      {
        title: '手写一个防抖函数',
        type: 'coding',
        difficulty: 3,
        knowledgePointId: js.id,
        referenceAnswer: '```javascript\nfunction debounce(fn, delay) {\n  let timer = null;\n  return function (...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n```',
        source: '手写题精选',
      },
      {
        title: '解释 JavaScript 中的闭包',
        type: 'concept',
        difficulty: 2,
        knowledgePointId: js.id,
        referenceAnswer: '闭包是指函数与其词法环境的组合。当一个函数在其词法作用域之外执行时，它仍然可以访问其词法作用域中的变量。',
      },
      {
        title: 'Vue3 Composition API vs Options API 的区别',
        type: 'concept',
        difficulty: 2,
        knowledgePointId: vue.id,
        referenceAnswer: 'Composition API 使用 setup() 函数，逻辑按功能组织；Options API 使用 data/methods/computed 等选项，逻辑按选项类型组织。',
      },
      {
        title: '实现一个 LRU Cache',
        type: 'algorithm',
        difficulty: 4,
        knowledgePointId: algorithm.id,
        referenceAnswer: '使用 Map 保持插入顺序，get 时移到末尾，put 时超出容量删除头部。',
      },
      {
        title: 'TCP 三次握手过程',
        type: 'concept',
        difficulty: 2,
        knowledgePointId: network.id,
        referenceAnswer: '1. 客户端发送 SYN\n2. 服务端回复 SYN+ACK\n3. 客户端发送 ACK',
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
