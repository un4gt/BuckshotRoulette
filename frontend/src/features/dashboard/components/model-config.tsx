import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { api } from '@/shared/api/client'
import { ModelFormDialog } from './model-form-dialog'
import type { AIProvider } from '@/agents/types'

export interface ModelConfigData {
  id: string
  name: string
  provider: AIProvider
  model: string
  baseUrl?: string
  enabled: boolean
}

export const ModelConfig = () => {
  const [models, setModels] = useState<ModelConfigData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelConfigData | null>(null)

  const fetchModels = async () => {
    try {
      setLoading(true)
      const data = await api.get<ModelConfigData[]>('/admin/models')
      setModels(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取模型列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const handleAdd = () => {
    setEditingModel(null)
    setDialogOpen(true)
  }

  const handleEdit = (model: ModelConfigData) => {
    setEditingModel(model)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此模型配置吗？')) return

    try {
      await api.delete(`/admin/models/${id}`)
      await fetchModels()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggleEnabled = async (model: ModelConfigData) => {
    try {
      await api.put(`/admin/models/${model.id}`, {
        ...model,
        enabled: !model.enabled,
      })
      await fetchModels()
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新失败')
    }
  }

  const handleSave = async () => {
    setDialogOpen(false)
    await fetchModels()
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-muted rounded mb-4" />
          <div className="space-y-2">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI 模型配置</h2>
        <Button size="sm" onClick={handleAdd}>
          + 添加模型
        </Button>
      </div>

      {error && (
        <div className="text-destructive text-sm mb-4">{error}</div>
      )}

      {models.length === 0 ? (
        <div className="text-muted-foreground text-sm text-center py-8">
          暂无模型配置，点击"添加模型"开始
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-2 px-2">名称</th>
                <th className="text-left py-2 px-2">提供商</th>
                <th className="text-left py-2 px-2">模型</th>
                <th className="text-left py-2 px-2">状态</th>
                <th className="text-right py-2 px-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id} className="border-b border-muted/50">
                  <td className="py-2 px-2">{model.name}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {model.provider}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground font-mono text-xs">
                    {model.model}
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => handleToggleEnabled(model)}
                      className={`px-2 py-0.5 rounded text-xs ${
                        model.enabled
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {model.enabled ? '启用' : '禁用'}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(model)}
                      className="h-7 px-2 text-xs"
                    >
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(model.id)}
                      className="h-7 px-2 text-xs text-destructive"
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModelFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        model={editingModel}
        onSave={handleSave}
      />
    </Card>
  )
}
