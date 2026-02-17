/**
 * Dashboard Page - /dashboard
 * 
 * This is the main application page where authenticated users can:
 * - View their bookmarks
 * - Add new bookmarks
 * - Delete existing bookmarks
 * - See real-time updates across multiple tabs
 * 
 * Security:
 * - RLS (Row Level Security) ensures users only see their own bookmarks
 * - All database operations are filtered by user_id automatically
 * 
 * Realtime:
 * - Uses Supabase channels to listen for INSERT and DELETE events
 * - Updates UI instantly when changes occur in any tab
 */

'use client'

import { useEffect, useState } from 'react'
import { supabase, type Bookmark } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { RealtimeChannel } from '@supabase/supabase-js'

export default function DashboardPage() {
  const router = useRouter()
  
  // State management
  const [user, setUser] = useState<any>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  
  // Form inputs
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  /**
   * Initialize: Check authentication and load bookmarks
   * Runs once when component mounts
   */
  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          // Not authenticated, redirect to login page
          router.push('/')
          return
        }

        setUser(user)

        // Get session and set realtime auth
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) {
          console.log('Setting realtime auth token')
          supabase.realtime.setAuth(session.access_token)
        }
        
        // Load user's bookmarks
        await fetchBookmarks()
      } catch (error) {
        console.error('Initialization error:', error)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [router])

  /**
   * Keep realtime auth in sync with session changes
   * This is required for postgres_changes to respect auth context
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        supabase.realtime.setAuth(session?.access_token ?? '')
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /**
   * Fetch bookmarks from Supabase
   * 
   * Thanks to RLS policies, this automatically filters by user_id
   * Users can only SELECT their own bookmarks
   */
  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching bookmarks:', error)
        return
      }

      setBookmarks(data || [])
    } catch (error) {
      console.error('Unexpected error fetching bookmarks:', error)
    }
  }

  /**
   * Set up Realtime Subscription
   * 
   * This listens for:
   * - INSERT events (new bookmarks added)
   * - DELETE events (bookmarks removed)
   * 
   * When events occur in database, UI updates automatically
   * Works across multiple tabs/windows
   */
  useEffect(() => {
    if (!user) return

    console.log('Setting up realtime subscription for user:', user.id)

    // Create a unique channel for bookmarks table
    const channel: RealtimeChannel = supabase
      .channel('public:bookmarks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          // Only listen to bookmarks created by current user
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 New bookmark INSERT event received:', payload.new)
          const next = payload.new as Bookmark
          
          // Add new bookmark to the top of the list
          setBookmarks((current) => {
            // Avoid duplicates
            if (current.some((item) => item.id === next.id)) {
              console.log('Duplicate bookmark, skipping:', next.id)
              return current
            }
            console.log('✅ Adding bookmark to list:', next.title)
            return [next, ...current]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          console.log('🔔 Bookmark DELETE event received from realtime:', payload.old)
          const deleted = payload.old as Bookmark
          
          // Remove deleted bookmark from list
          // RLS already ensures this is the current user's bookmark
          setBookmarks((current) => {
            const alreadyRemoved = !current.some((item) => item.id === deleted.id)
            
            if (alreadyRemoved) {
              console.log('⏭️ Bookmark already removed from UI:', deleted.id)
              return current
            }
            
            const filtered = current.filter((bookmark) => bookmark.id !== deleted.id)
            console.log('✅ Removed bookmark from list (realtime sync):', deleted.id)
            return filtered
          })
        }
      )
      .on('error', (error) => {
        console.error('❌ Realtime subscription error:', error)
      })
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime changes')
        }
      })

    // Cleanup: unsubscribe when component unmounts or user changes
    return () => {
      console.log('Cleaning up realtime subscription')
      channel.unsubscribe()
    }
  }, [user])

  /**
   * Add a new bookmark
   * 
   * Validates inputs and inserts into Supabase
   * RLS ensures user_id is automatically set correctly
   */
  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim() || !url.trim()) {
      alert('Please fill in both title and URL')
      return
    }

    // Basic URL validation
    let validUrl = url.trim()
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl
    }

    try {
      setAdding(true)

      const { data, error } = await supabase.from('bookmarks').insert([
        {
          user_id: user.id,
          title: title.trim(),
          url: validUrl,
        },
      ]).select()

      if (error) {
        console.error('Error adding bookmark:', error)
        alert('Failed to add bookmark. Please try again.')
        return
      }

      // If realtime doesn't update, add it manually as fallback
      if (data && data.length > 0) {
        const newBookmark = data[0] as Bookmark
        setBookmarks((current) => [newBookmark, ...current])
      }

      // Clear form inputs
      setTitle('')
      setUrl('')
    } catch (error) {
      console.error('Unexpected error adding bookmark:', error)
      alert('An unexpected error occurred.')
    } finally {
      setAdding(false)
    }
  }

  /**
   * Delete a bookmark
   * 
   * RLS ensures users can only delete their own bookmarks
   * Updates instantly with fallback if realtime is delayed
   */
  const handleDeleteBookmark = async (id: string) => {
    try {
      console.log('🗑️ User initiated delete for bookmark:', id)
      
      // Remove from UI immediately for instant feedback
      setBookmarks((current) => {
        const filtered = current.filter((item) => item.id !== id)
        console.log('📋 Local state updated, removed bookmark:', id)
        return filtered
      })

      // Then delete from database
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('❌ Error deleting from database:', error)
        // Refresh bookmarks in case delete failed
        await fetchBookmarks()
        alert('Failed to delete bookmark. Please try again.')
        return
      }

      console.log('✅ Bookmark deleted successfully from database:', id)
    } catch (error) {
      console.error('❌ Unexpected error deleting bookmark:', error)
      // Refresh bookmarks in case of error
      await fetchBookmarks()
      alert('An unexpected error occurred.')
    }
  }

  /**
   * Sign out user
   */
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your bookmarks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Bookmark Manager
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Bookmark Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Add New Bookmark
          </h2>
          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., React Documentation"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={adding}
              />
            </div>
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                URL
              </label>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://react.dev"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={adding}
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Bookmark
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bookmarks List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Bookmarks ({bookmarks.length})
          </h2>
          
          {bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No bookmarks yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first bookmark above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                        {bookmark.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                        {bookmark.url}
                      </p>
                    </a>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Added {new Date(bookmark.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBookmark(bookmark.id)}
                    className="ml-4 p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete bookmark"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Real-time Sync Active
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Try opening this page in multiple tabs. Any changes you make will instantly
                appear in all tabs!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
