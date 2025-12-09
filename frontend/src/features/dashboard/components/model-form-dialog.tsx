import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { api } from '@/shared/api/client'
import type { ModelConfigData } from './model-config'
import type { AIProvider } from '@/agents/types'

const AI_PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'grok', label: 'Grok (X.AI)' },
  { value: 'openrouter', label: 'OpenRouter' },
  { value: 'openai-compatible', label: 'OpenAI 兼容' },
]

interface ModelFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  model: ModelConfigData | null
  onSave: () => void
}

export const ModelFormDialog = ({
  open,
  onOpenChange,
  model,
  onSave,
}: ModelFormDialogProps) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    provider: 'openai' as AIProvider,
    model: '',
    apiKey: '',
    baseUrl: '',
    enabled: true,
  })

  // 编辑时填充数据
  useEffect(() => {
    if (model) {
      setFormData({
        name: model.name,
        provider: model.provider,
        model: model.model,
        apiKey: '', // API Key 不回显
        baseUrl: model.baseUrl || '',
        enabled: model.enabled,
      })
    } else {
      setFormData({
        name: '',
        provider: 'openai',
        model: '',
        apiKey: '',
        baseUrl: '',
        enabled: true,
      })
    }
  }, [model, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        provider: formData.provider,
        model: formData.model,
        apiKey: formData.apiKey || undefined, // 编辑时可以不改 key
        baseUrl: formData.baseUrl || undefined,
        enabled: formData.enabled,
      }

      if (model) {
        await api.put(`/admin/models/${model.id}`, payload)
      } else {
        await api.post('/admin/models', payload)
      }

      onSave()
    } catch (err) {
      alert(err instanceof Error ? err.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const showBaseUrl = formData.provider === 'openai-compatible'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {model ? '编辑模型' : '添加模型'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="显示名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如: GPT-4o"
            required
          />

          <Select
            id="provider"
            label="提供商"
            value={formData.provider}
            onChange={(e) =>
              setFormData({ ...formData, provider: e.target.value as AIProvider })
            }
            options={AI_PROVIDERS}
          />

          <Input
            id="model"
            label="模型标识"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="例如: gpt-4o, claude-3-opus-20240229"
            required
          />

          <Input
            id="apiKey"
            label={model ? 'API Key (留空则保持不变)' : 'API Key'}
            type="password"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            placeholder={model ? '••••••••' : '输入 API Key'}
            required={!model}
          />

          {showBaseUrl && (
            <Input
              id="baseUrl"
              label="自定义端点"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
            />
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="enabled" className="text-sm">
              启用此模型
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
