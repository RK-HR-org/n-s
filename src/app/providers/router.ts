import { createRouter, createWebHistory } from 'vue-router'
import { HomePage } from '@/pages/home'
import { ResumeSearchPage } from '@/pages/resume-search'
import { VacancySearchPage } from '@/pages/vacancy-search'
import { SearchHistoryPage } from '@/pages/search-history'
import { UsersPage } from '@/pages/users'
import { TeamsPage } from '@/pages/teams'
import { ProfilePage } from '@/pages/profile'
import { ManagementPage } from '@/pages/management'
import { useUserStore } from '@/entities/user'

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
            path: '/vacancy-search',
            name: 'vacancy-search',
            component: VacancySearchPage
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
            component: UsersPage,
            meta: { requiresPermission: 'view_users_list' }
        },
        {
            path: '/teams',
            name: 'teams',
            component: TeamsPage,
            meta: { requiresPermission: 'view_teams_list' }
        },
        {
            path: '/profile',
            name: 'profile',
            component: ProfilePage
        },
        {
            path: '/management',
            name: 'management',
            component: ManagementPage
        }
    ]
})

router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    // Wait for user to be loaded if there's a token but user is not fetched yet
    if (localStorage.getItem('access_token') && !userStore.user) {
        try {
            await userStore.fetchMe()
        } catch (e) {
            // Token invalid or failed to fetch
        }
    }

    const requiredPermission = to.meta.requiresPermission as string | undefined

    if (requiredPermission) {
        if (!userStore.isAuthenticated) {
            return next({ name: 'home' })
        }

        if (!userStore.hasPermission(requiredPermission as any)) {
            // Check if it's the specific strings or casted
            return next({ name: 'home' }) // or perhaps a 403 route if you have one
        }
    }

    next()
})
