import { createRouter, createWebHistory } from 'vue-router'
import { HomePage } from '@/pages/home'
import { ResumeSearchPage } from '@/pages/resume-search'
import { SearchHistoryPage } from '@/pages/search-history'
import { UsersPage } from '@/pages/users'
import { TeamsPage } from '@/pages/teams'
import { ProfilePage } from '@/pages/profile'

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomePage
        },
        {
            path: '/resume-search',
            name: 'resume-search',
            component: ResumeSearchPage
        },
        {
            path: '/search-history',
            name: 'search-history',
            component: SearchHistoryPage
        },
        {
            path: '/search-history/:id',
            name: 'search-session',
            component: () => import('@/pages/search-session/ui/SearchSessionPage.vue').then(m => m.default)
        },
        {
            path: '/users',
            name: 'users',
            component: UsersPage
        },
        {
            path: '/teams',
            name: 'teams',
            component: TeamsPage
        },
        {
            path: '/profile',
            name: 'profile',
            component: ProfilePage
        }
    ]
})
