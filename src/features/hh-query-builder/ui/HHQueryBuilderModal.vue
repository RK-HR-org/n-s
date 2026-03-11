<script setup lang="ts">
import { ref, watch, h } from 'vue'
import {
  NModal, NTree, NButton, NSpace, NInput, NSelect, NCheckbox, NText
} from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import type { QueryNode } from '../model/types'
import { parseQuery } from '../model/parser'

const props = defineProps<{
  show: boolean
  initialQuery?: string
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'submit', query: string): void
}>()

let uid = 0
const generateId = () => `node_${Date.now()}_${uid++}`

const treeData = ref<QueryNode[]>([])
const expandedKeys = ref<string[]>([])

const gatherExpandedKeys = (nodes: QueryNode[], keys: string[]) => {
  for (const n of nodes) {
    if (n.type === 'GROUP' || n.type === 'LEAF') {
      keys.push(n.key)
    }
    if (n.children && n.children.length > 0) {
      gatherExpandedKeys(n.children, keys)
    }
  }
}

const initTree = () => {
  if (props.initialQuery && props.initialQuery.trim().length > 0) {
    const parsed = parseQuery(props.initialQuery, generateId)
    if (parsed.length > 0) {
      treeData.value = parsed
      const keys: string[] = []
      gatherExpandedKeys(parsed, keys)
      expandedKeys.value = keys
      return
    }
  }

  // default empty tree
  const rootKey = generateId()
  const leafKey = generateId()
  const root: QueryNode = {
    key: rootKey,
    type: 'GROUP',
    operator: 'AND',
    children: [{
      key: leafKey,
      type: 'LEAF',
      text: '',
      exact: false
    }]
  }
  expandedKeys.value = [rootKey, leafKey]
  treeData.value = [root]
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    initTree()
  }
})

const addRule = (parent: QueryNode) => {
  if (!parent.children) parent.children = []
  const newKey = generateId()
  parent.children.push({
    key: newKey,
    type: 'LEAF',
    text: '',
    exact: false
  })
  if (!expandedKeys.value.includes(parent.key)) {
    expandedKeys.value.push(parent.key)
  }
}

const addGroup = (parent: QueryNode) => {
  if (!parent.children) parent.children = []
  const newKey = generateId()
  parent.children.push({
    key: newKey,
    type: 'GROUP',
    operator: 'AND',
    children: [{
      key: generateId(),
      type: 'LEAF',
      text: '',
      exact: false
    }]
  })
  if (!expandedKeys.value.includes(parent.key)) {
    expandedKeys.value.push(parent.key)
  }
  expandedKeys.value.push(newKey)
}

const removeNode = (nodes: QueryNode[], keyToRemove: string): boolean => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].key === keyToRemove) {
      nodes.splice(i, 1)
      return true
    }
    if (nodes[i].children) {
      if (removeNode(nodes[i].children!, keyToRemove)) {
        return true
      }
    }
  }
  return false
}

const handleRemove = (key: string) => {
  if (!treeData.value.length || treeData.value[0].key === key) return
  removeNode(treeData.value, key)
}

const NSelectOptions = [
  { label: 'И', value: 'AND' },
  { label: 'ИЛИ', value: 'OR' },
  { label: 'НЕ', value: 'NOT' }
]

const renderLabel = ({ option }: { option: TreeOption }) => {
  const node = option as unknown as QueryNode

  if (node.type === 'GROUP') {
    return h(NSpace, { align: 'center', inline: true }, {
      default: () => [
        h(NSelect, {
          value: node.operator || 'AND',
          options: NSelectOptions,
          size: 'small',
          style: 'width: 120px',
          onClick: (e: MouseEvent) => e.stopPropagation(),
          'onUpdate:value': (v: 'AND' | 'OR' | 'NOT') => { node.operator = v }
        }),
        h(NButton, {
          size: 'small',
          type: 'primary',
          ghost: true,
          onClick: (e: MouseEvent) => { e.stopPropagation(); addRule(node) }
        }, { default: () => '+ Правило' }),
        h(NButton, {
          size: 'small',
          type: 'info',
          ghost: true,
          onClick: (e: MouseEvent) => { e.stopPropagation(); addGroup(node) }
        }, { default: () => '+ Группа' }),
        treeData.value[0].key !== node.key ? h(NButton, {
          size: 'small',
          type: 'error',
          ghost: true,
          onClick: (e: MouseEvent) => { e.stopPropagation(); handleRemove(node.key) }
        }, { default: () => 'Удалить' }) : null
      ]
    })
  } else {
    return h(NSpace, { align: 'center', inline: true }, {
      default: () => [
        h(NInput, {
          value: node.text || '',
          placeholder: 'Слово, фраза, компания...',
          size: 'small',
          style: 'width: 250px',
          onClick: (e: MouseEvent) => e.stopPropagation(),
          'onUpdate:value': (v: string) => { node.text = v }
        }),
        h(NCheckbox, {
          checked: node.exact || false,
          onClick: (e: MouseEvent) => e.stopPropagation(),
          'onUpdate:checked': (v: boolean) => { node.exact = v }
        }, { default: () => 'Точное совпадение (!)' }),
        h(NButton, {
          size: 'small',
          type: 'error',
          ghost: true,
          onClick: (e: MouseEvent) => { e.stopPropagation(); handleRemove(node.key) }
        }, { default: () => 'Удалить' })
      ]
    })
  }
}

const generateQueryStr = (node: QueryNode): string => {
  if (node.type === 'LEAF') {
    let text = (node.text || '').trim();
    if (!text) return '';
    
    if (text.includes(' ') && !text.startsWith('"') && !text.endsWith('"')) {
      text = `"${text}"`;
    }
    
    if (node.exact) {
      text = `!${text}`;
    }
    return text;
  }
  
  if (node.type === 'GROUP') {
    if (!node.children || node.children.length === 0) return '';
    
    const childQueries = node.children
      .map(child => generateQueryStr(child))
      .filter(q => q !== '');
      
    if (childQueries.length === 0) return '';
    
    if (childQueries.length === 1) {
      if (node.operator === 'NOT') return `NOT ${childQueries[0]}`;
      return childQueries[0];
    }
    
    if (node.operator === 'OR') {
      return `(${childQueries.join(' OR ')})`;
    } else if (node.operator === 'AND') {
      return `(${childQueries.join(' AND ')})`;
    } else if (node.operator === 'NOT') {
      return `NOT (${childQueries.join(' OR ')})`;
    }
  }
  return '';
}

const handleApply = () => {
  if (!treeData.value.length) {
    emit('submit', '')
    emit('update:show', false)
    return
  }
  let q = generateQueryStr(treeData.value[0])
  if (q.startsWith('(') && q.endsWith(')')) {
    q = q.slice(1, -1)
  }
  emit('submit', q)
  emit('update:show', false)
}
</script>

<template>
  <n-modal
    :show="show"
    @update:show="val => emit('update:show', val)"
    preset="card"
    title="Конструктор поисковых запросов"
    style="width: 800px; max-width: 90vw;"
  >
    <div style="margin-bottom: 24px;">
      <n-text depth="3">
        Постройте логическую структуру запроса. Используйте операторы <b>И</b> (присутствуют все слова), <b>ИЛИ</b> (присутствует хотя бы одно слово) и <b>НЕ</b> (исключить слова).<br />
        «Точное совпадение» найдет слово именно в такой форме (падеж, число), как вы указали.
      </n-text>
    </div>
    
    <n-tree
      block-line
      expand-on-click
      :data="(treeData as any)"
      :render-label="renderLabel"
      v-model:expanded-keys="expandedKeys"
    />

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:show', false)">Отмена</n-button>
        <n-button type="primary" @click="handleApply">Применить</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
