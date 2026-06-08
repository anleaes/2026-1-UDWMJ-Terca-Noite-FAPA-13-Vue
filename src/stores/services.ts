import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'
import type { ServiceCategory, ServiceCategoryType } from '@/types/service-order'
import { getApiErrorMessage } from '@/utils/api-error'

type ServiceCategoryRecord = ServiceCategory & { id: string }

export const useServicesStore = defineStore('services', () => {
  const categories = ref<ServiceCategory[]>([])
  const isLoading = ref(false)
  const apiError = ref<string | null>(null)

  function getCategoryByType(type: ServiceCategoryType): ServiceCategory | undefined {
    return categories.value.find((category) => category.type === type)
  }

  function getBasePrice(type: ServiceCategoryType): number {
    return getCategoryByType(type)?.base_price ?? 0
  }

  async function fetchCategories(): Promise<void> {
    isLoading.value = true
    apiError.value = null

    try {
      const response = await api.get<ServiceCategoryRecord[]>('/serviceCategories')
      categories.value = response.data.map(({ type, name, base_price, unit_label }) => ({
        type,
        name,
        base_price,
        unit_label,
      }))
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    categories,
    isLoading,
    apiError,
    getCategoryByType,
    getBasePrice,
    fetchCategories,
  }
})
