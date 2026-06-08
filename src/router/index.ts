import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/layouts/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
      redirect: { name: 'dashboard' },
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: 'Dashboard' },
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/views/ClientesView.vue'),
          meta: { title: 'Clientes' },
        },
        {
          path: 'vagas',
          name: 'vagas',
          component: () => import('@/views/VagasView.vue'),
          meta: { title: 'Vagas' },
        },
        {
          path: 'mensalidades',
          name: 'mensalidades',
          component: () => import('@/views/MensalidadesView.vue'),
          meta: { title: 'Mensalidades' },
        },
        {
          path: 'caixa',
          name: 'caixa',
          component: () => import('@/views/CaixaView.vue'),
          meta: { title: 'Caixa' },
        },
      ],
    },
  ],
})

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : 'A3'
  document.title = `${title} | A3`
})

export default router
