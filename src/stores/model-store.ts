/**
 * 模型提供商管理 Store
 *
 * 管理模型提供商配置（持久化到本地存储）
 * 只缓存用户配置（apiKey、启用状态等），模型列表从内置模板加载
 */

import { create } from "zustand";
import * as ipc from "@/services/ipc-client";
import type { Model, ModelProvider, ProviderUserConfig } from "@/types/model";
import {
  BUILTIN_PROVIDER_TEMPLATES,
  createProviderFromTemplate,
} from "@/constants/model-providers";

const STORAGE_NAMESPACE = "model";
const STORAGE_KEY = "provider-configs";

interface ModelState {
  /** 提供商列表 */
  providers: ModelProvider[];
  /** 是否已加载 */
  loaded: boolean;

  /** 从本地存储加载提供商配置 */
  loadProviders: () => Promise<void>;
  /** 添加提供商 */
  addProvider: (provider: ModelProvider) => Promise<void>;
  /** 更新提供商 */
  updateProvider: (provider: ModelProvider) => Promise<void>;
  /** 删除提供商 */
  removeProvider: (providerId: string) => Promise<void>;
  /** 切换提供商启用状态 */
  toggleProvider: (providerId: string) => Promise<void>;
  /** 更新提供商的模型列表 */
  updateModels: (providerId: string, models: Model[]) => Promise<void>;
  /** 切换单个模型启用状态 */
  toggleModel: (providerId: string, modelId: string) => Promise<void>;
  /** 添加自定义模型到指定提供商 */
  addModel: (providerId: string, model: Model) => Promise<void>;
  /** 删除自定义模型 */
  removeModel: (providerId: string, modelId: string) => Promise<void>;
}

/**
 * 从模板创建提供商，并合并用户配置
 */
function createProviderWithConfig(
  template: (typeof BUILTIN_PROVIDER_TEMPLATES)[number],
  userConfig?: ProviderUserConfig,
): ModelProvider {
  const provider = createProviderFromTemplate(template);

  if (userConfig) {
    provider.apiKey = userConfig.apiKey;
    provider.enabled = userConfig.enabled;
    if (userConfig.apiHost && userConfig.apiHost !== template.apiHost) {
      provider.apiHost = userConfig.apiHost;
    }
    // 合并模型启用状态
    if (userConfig.modelEnabledStates) {
      provider.models = provider.models.map((m) => ({
        ...m,
        enabled: userConfig.modelEnabledStates?.[m.id] ?? m.enabled,
      }));
    }
  }

  return provider;
}

async function persistConfigs(configs: ProviderUserConfig[]) {
  await ipc.storageSet({
    namespace: STORAGE_NAMESPACE,
    key: STORAGE_KEY,
    value: configs,
  });
}

export const useModelStore = create<ModelState>((set, get) => ({
  providers: [],
  loaded: false,

  loadProviders: async () => {
    try {
      const res = await ipc.storageGet({
        namespace: STORAGE_NAMESPACE,
        key: STORAGE_KEY,
      });
      const savedConfigs = (res.value ?? []) as ProviderUserConfig[];

      // 转换为 Map 方便查找
      const configMap = new Map(savedConfigs.map((c) => [c.id, c]));

      // 从模板创建提供商，合并用户配置
      const providers = BUILTIN_PROVIDER_TEMPLATES.map((tpl) =>
        createProviderWithConfig(tpl, configMap.get(tpl.id)),
      );

      // 添加用户自定义的提供商（非内置）
      const builtinIds = new Set(BUILTIN_PROVIDER_TEMPLATES.map((t) => t.id));
      const customProviders = savedConfigs
        .filter((c) => !builtinIds.has(c.id))
        .map((c) => {
          const provider: ModelProvider = {
            id: c.id,
            name: c.id,
            type: "openai-compatible",
            apiKey: c.apiKey,
            apiHost: c.apiHost ?? "",
            enabled: c.enabled,
            isSystem: false,
            models: [],
          };
          return provider;
        });

      set({
        providers: [...providers, ...customProviders],
        loaded: true,
      });
    } catch {
      // 如果加载失败，用内置模板初始化
      const providers = BUILTIN_PROVIDER_TEMPLATES.map(
        createProviderFromTemplate,
      );
      set({ providers, loaded: true });
    }
  },

  addProvider: async (provider) => {
    const providers = [...get().providers, provider];
    set({ providers });

    // 保存用户配置
    const configs: ProviderUserConfig[] = providers
      .filter((p) => !p.isSystem)
      .map((p) => ({
        id: p.id,
        apiKey: p.apiKey,
        apiHost: p.apiHost,
        enabled: p.enabled,
      }));
    await persistConfigs(configs);
  },

  updateProvider: async (provider) => {
    const providers = get().providers.map((p) =>
      p.id === provider.id ? provider : p,
    );
    set({ providers });

    // 保存用户配置
    const configs: ProviderUserConfig[] = providers
      .filter((p) => !p.isSystem)
      .map((p) => ({
        id: p.id,
        apiKey: p.apiKey,
        apiHost: p.apiHost,
        enabled: p.enabled,
      }));
    await persistConfigs(configs);
  },

  removeProvider: async (providerId) => {
    const providers = get().providers.filter((p) => p.id !== providerId);
    set({ providers });

    // 保存用户配置
    const configs: ProviderUserConfig[] = providers
      .filter((p) => !p.isSystem)
      .map((p) => ({
        id: p.id,
        apiKey: p.apiKey,
        apiHost: p.apiHost,
        enabled: p.enabled,
      }));
    await persistConfigs(configs);
  },

  toggleProvider: async (providerId) => {
    const providers = get().providers.map((p) =>
      p.id === providerId ? { ...p, enabled: !p.enabled } : p,
    );
    set({ providers });

    // 保存用户配置
    const configs: ProviderUserConfig[] = providers
      .filter((p) => !p.isSystem)
      .map((p) => ({
        id: p.id,
        apiKey: p.apiKey,
        apiHost: p.apiHost,
        enabled: p.enabled,
      }));
    await persistConfigs(configs);
  },

  updateModels: async (providerId, models) => {
    const providers = get().providers.map((p) =>
      p.id === providerId ? { ...p, models } : p,
    );
    set({ providers });
  },

  toggleModel: async (providerId, modelId) => {
    const providers = get().providers.map((p) => {
      if (p.id !== providerId) return p;
      return {
        ...p,
        models: p.models.map((m) =>
          m.id === modelId ? { ...m, enabled: !m.enabled } : m,
        ),
      };
    });
    set({ providers });

    // 保存模型启用状态
    const enabledStates: Record<string, Record<string, boolean>> = {};
    for (const p of providers) {
      if (!p.isSystem) continue;
      const states: Record<string, boolean> = {};
      for (const m of p.models) {
        if (!m.enabled) {
          states[m.id] = false;
        }
      }
      if (Object.keys(states).length > 0) {
        enabledStates[p.id] = states;
      }
    }

    const configs: ProviderUserConfig[] = providers
      .filter((p) => !p.isSystem)
      .map((p) => ({
        id: p.id,
        apiKey: p.apiKey,
        apiHost: p.apiHost,
        enabled: p.enabled,
        modelEnabledStates: enabledStates[p.id],
      }));
    await persistConfigs(configs);
  },

  addModel: async (providerId, model) => {
    const providers = get().providers.map((p) => {
      if (p.id !== providerId) return p;
      return { ...p, models: [...p.models, model] };
    });
    set({ providers });
  },

  removeModel: async (providerId, modelId) => {
    const providers = get().providers.map((p) => {
      if (p.id !== providerId) return p;
      return { ...p, models: p.models.filter((m) => m.id !== modelId) };
    });
    set({ providers });
  },
}));
