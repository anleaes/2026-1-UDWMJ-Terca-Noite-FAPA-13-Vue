import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import type { ParkingSpot, ParkingSpotDisplay } from '@/types/parking-spot'
import type { ApiParkingSpotStatus } from '@/utils/parking-spot-status'
import { fromApiParkingSpotStatus, toApiParkingSpotStatus } from '@/utils/parking-spot-status'
import { getApiErrorMessage } from '@/utils/api-error'
import { resolveDisplayStatus } from '@/utils/spot-status'

type ParkingSpotRecord = {
  id: string
  code: string
  status: string
}

function mapParkingSpot(record: ParkingSpotRecord): ParkingSpot {
  return {
    id: record.id,
    code: record.code,
    status: fromApiParkingSpotStatus(record.status),
  }
}

export const useParkingSpotsStore = defineStore('parkingSpots', () => {
  const spots = ref<ParkingSpot[]>([])
  const isLoading = ref(false)
  const apiError = ref<string | null>(null)

  const sortedSpots = computed(() =>
    [...spots.value].sort((left, right) => left.code.localeCompare(right.code, 'pt-BR')),
  )

  function getSpotById(id: string): ParkingSpot | undefined {
    return spots.value.find((spot) => spot.id === id)
  }

  function getSpotByCode(code: string): ParkingSpot | undefined {
    return spots.value.find((spot) => spot.code === code)
  }

  async function fetchParkingSpots(): Promise<void> {
    isLoading.value = true
    apiError.value = null

    try {
      const response = await api.get<ParkingSpotRecord[]>('/parkingSpots')
      spots.value = response.data.map(mapParkingSpot)
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  }

  async function patchSpotStatus(id: string, status: ApiParkingSpotStatus | ParkingSpot['status']): Promise<boolean> {
    const spot = getSpotById(id)

    if (!spot) {
      return false
    }

    const apiStatus =
      status === 'Livre' || status === 'Ocupada' || status === 'Reservada'
        ? status
        : toApiParkingSpotStatus(status)

    try {
      const response = await api.patch<ParkingSpotRecord>(`/parkingSpots/${id}`, {
        id: spot.id,
        code: spot.code,
        status: apiStatus,
      })

      const index = spots.value.findIndex((item) => item.id === id)

      if (index === -1) {
        return false
      }

      spots.value[index] = mapParkingSpot(response.data)
      apiError.value = null
      return true
    } catch (error) {
      apiError.value = getApiErrorMessage(error)
      return false
    }
  }

  async function reserveSpot(id: string): Promise<boolean> {
    const spot = getSpotById(id)

    if (!spot || spot.status !== 'free') {
      return false
    }

    return patchSpotStatus(id, 'Reservada')
  }

  async function releaseSpot(id: string): Promise<boolean> {
    const spot = getSpotById(id)

    if (!spot) {
      return false
    }

    return patchSpotStatus(id, 'Livre')
  }

  async function markOccupied(id: string): Promise<boolean> {
    const spot = getSpotById(id)

    if (!spot || spot.status === 'occupied') {
      return false
    }

    return patchSpotStatus(id, 'Ocupada')
  }

  async function releaseOccupancy(id: string, hasActiveSubscription: boolean): Promise<boolean> {
    const spot = getSpotById(id)

    if (!spot || spot.status !== 'occupied') {
      return false
    }

    return patchSpotStatus(id, hasActiveSubscription ? 'Reservada' : 'Livre')
  }

  function isSpotAvailableForSubscription(id: string): boolean {
    const spot = getSpotById(id)
    return Boolean(spot && spot.status === 'free')
  }

  function buildDisplayList(
    activeSubscriptionBySpot: Map<string, { subscriptionId: string; customerName: string; vehiclePlate: string }>,
  ): ParkingSpotDisplay[] {
    return sortedSpots.value.map((spot) => {
      const subscription = activeSubscriptionBySpot.get(spot.id)
      const hasActiveSubscription = Boolean(subscription)

      return {
        spot,
        displayStatus: resolveDisplayStatus(spot.status, hasActiveSubscription),
        subscriptionId: subscription?.subscriptionId,
        customerName: subscription?.customerName,
        vehiclePlate: subscription?.vehiclePlate,
      }
    })
  }

  return {
    spots,
    isLoading,
    apiError,
    sortedSpots,
    fetchParkingSpots,
    getSpotById,
    getSpotByCode,
    patchSpotStatus,
    reserveSpot,
    releaseSpot,
    markOccupied,
    releaseOccupancy,
    isSpotAvailableForSubscription,
    buildDisplayList,
  }
})
