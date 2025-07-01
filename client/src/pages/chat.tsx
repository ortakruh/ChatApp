import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { auth } from "@/lib/auth";
import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProfileModal from "@/components/profile-modal";
import AddFriendModal from "@/components/add-friend-modal";

export default function ChatPage() {
  const [, navigate] = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const currentUser = auth.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) {
      navigate("/auth");
    }
  }, [currentUser, navigate]);

  const { data: friends = [] } = useQuery<(User & { status: string; isRequestReceiver?: boolean; friendshipId: number })[]>({
    queryKey: ["/api/user/" + currentUser?.id + "/friends"],
    enabled: !!currentUser,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async ({ friendId, status }: { friendId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/user/${currentUser?.id}/friends/${friendId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${currentUser?.id}/friends`] });
      toast({
        title: "Friend request updated",
        description: "Friend request has been processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update friend request",
        variant: "destructive",
      });
    },
  });

  if (!currentUser) {
    return null;
  }

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  return (
    <div className="h-screen discord-bg-darkest flex">
      {/* Sidebar */}
      <div className="w-60 discord-bg-darker flex flex-col">
        {/* Server/DM Header */}
        <div className="p-4 border-b border-[hsl(221,8%,13%)]">
          <div className="flex items-center justify-between">
            <h2 className="discord-text-white font-semibold">Direct Messages</h2>
            <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Friends/DM List */}
        <div className="flex-1 overflow-y-auto discord-scrollbar">
          <div className="p-2">
            <div className="flex items-center px-2 py-2 rounded hover:discord-bg-dark cursor-pointer">
              <svg className="w-5 h-5 discord-text mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="discord-text">Friends</span>
            </div>
            <div className="flex items-center px-2 py-2 rounded hover:discord-bg-dark cursor-pointer">
              <svg className="w-5 h-5 discord-text mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <span className="discord-text">Library</span>
            </div>
          </div>
          
          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="discord-text text-xs font-semibold uppercase">Direct Messages</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="discord-text hover:discord-text-white"
                onClick={() => setShowAddFriendModal(true)}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
                </svg>
              </Button>
            </div>
            
            {/* Friend List */}
            <div className="space-y-1">
              {friends.filter(friend => friend.status === 'accepted').map((friend) => (
                <div key={friend.id} className="flex items-center px-2 py-1 rounded hover:discord-bg-dark cursor-pointer">
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={friend.avatar || undefined} />
                    <AvatarFallback className="bg-[hsl(235,86%,65%)] text-white text-xs">
                      {friend.displayName?.[0] || friend.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="discord-text text-sm">{friend.displayName || friend.username}</span>
                  <div className="ml-auto w-2 h-2 rounded-full discord-green"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Area */}
        <div className="p-2 discord-bg-darkest">
          <div className="flex items-center">
            <Avatar 
              className="w-8 h-8 mr-3 cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
              <AvatarImage src={currentUser.avatar || undefined} />
              <AvatarFallback className="bg-[hsl(235,86%,65%)] text-white">
                {currentUser.displayName?.[0] || currentUser.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="discord-text-white text-sm font-medium">
                {currentUser.displayName || currentUser.username}
              </div>
              <div className="discord-text text-xs">#{currentUser.friendCode?.split('#')[1] || '1234'}</div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white p-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.565-.45-3.026-1.243-4.243a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="discord-text hover:discord-text-white p-1"
                onClick={handleLogout}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="discord-bg-darker p-4 border-b border-[hsl(221,8%,13%)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-6 h-6 discord-text mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="discord-text-white font-semibold">Friends</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Friends Interface */}
        <div className="flex-1 flex">
          {/* Friends List */}
          <div className="flex-1 p-6">
            <div className="flex items-center space-x-6 mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setActiveTab("all")}
                className={`font-medium pb-1 hover:bg-transparent rounded-none ${
                  activeTab === "all" 
                    ? "discord-text-white border-b-2 border-[hsl(235,86%,65%)]" 
                    : "discord-text hover:discord-text-white"
                }`}
              >
                All
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("online")} 
                className={`hover:bg-transparent ${
                  activeTab === "online" 
                    ? "discord-text-white border-b-2 border-[hsl(235,86%,65%)]" 
                    : "discord-text hover:discord-text-white"
                }`}
              >
                Online
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("pending")} 
                className={`hover:bg-transparent ${
                  activeTab === "pending" 
                    ? "discord-text-white border-b-2 border-[hsl(235,86%,65%)]" 
                    : "discord-text hover:discord-text-white"
                }`}
              >
                Pending
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setActiveTab("blocked")} 
                className={`hover:bg-transparent ${
                  activeTab === "blocked" 
                    ? "discord-text-white border-b-2 border-[hsl(235,86%,65%)]" 
                    : "discord-text hover:discord-text-white"
                }`}
              >
                Blocked
              </Button>
              <Button 
                onClick={() => setShowAddFriendModal(true)}
                className="discord-green text-white px-3 py-1 rounded text-sm hover:bg-opacity-90"
              >
                Add Friend
              </Button>
            </div>

            {/* Friends Content */}
            {activeTab === "all" && (
              <>
                <div className="border-b border-[hsl(221,8%,13%)] pb-2 mb-4">
                  <span className="discord-text text-sm font-medium">ONLINE — {friends.filter(f => f.status === 'accepted').length}</span>
                </div>
                <div className="space-y-2">
                  {friends.filter(f => f.status === 'accepted').length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="discord-text text-sm">
                        No friends yet.<br/>
                        Use the "Add Friend" button to start connecting!
                      </p>
                    </div>
                  ) : (
                    friends.filter(f => f.status === 'accepted').map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded hover:discord-bg-dark">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 mr-4">
                            <AvatarImage src={friend.avatar || undefined} />
                            <AvatarFallback className="bg-[hsl(235,86%,65%)] text-white">
                              {friend.displayName?.[0] || friend.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="discord-text-white font-medium">
                              {friend.displayName || friend.username}
                            </div>
                            <div className="discord-text text-sm">Online</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="discord-bg-dark p-2 rounded-full discord-text hover:discord-text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="discord-bg-dark p-2 rounded-full discord-text hover:discord-text-white">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === "pending" && (
              <>
                <div className="border-b border-[hsl(221,8%,13%)] pb-2 mb-4">
                  <span className="discord-text text-sm font-medium">PENDING — {friends.filter(f => f.status === 'pending').length}</span>
                </div>
                <div className="space-y-2">
                  {friends.filter(f => f.status === 'pending').length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">⏳</div>
                      <p className="discord-text text-sm">
                        No pending friend requests.
                      </p>
                    </div>
                  ) : (
                    friends.filter(f => f.status === 'pending').map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded hover:discord-bg-dark">
                        <div className="flex items-center">
                          <Avatar className="w-10 h-10 mr-4">
                            <AvatarImage src={friend.avatar || undefined} />
                            <AvatarFallback className="bg-[hsl(235,86%,65%)] text-white">
                              {friend.displayName?.[0] || friend.username[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="discord-text-white font-medium">
                              {friend.displayName || friend.username}
                            </div>
                            <div className="discord-text text-sm">
                              {friend.isRequestReceiver ? 'Incoming Friend Request' : 'Outgoing Friend Request'}
                            </div>
                          </div>
                        </div>
                        {friend.isRequestReceiver && (
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => acceptFriendMutation.mutate({ friendId: friend.id, status: 'accepted' })}
                              className="discord-green text-white px-3 py-1 rounded text-sm hover:bg-opacity-90"
                              disabled={acceptFriendMutation.isPending}
                            >
                              Accept
                            </Button>
                            <Button 
                              onClick={() => acceptFriendMutation.mutate({ friendId: friend.id, status: 'rejected' })}
                              variant="outline"
                              className="border-gray-500 text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-700"
                              disabled={acceptFriendMutation.isPending}
                            >
                              Ignore
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {(activeTab === "online" || activeTab === "blocked") && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <p className="discord-text text-sm">
                  This section is not implemented yet.
                </p>
              </div>
            )}
          </div>

          {/* Activity Sidebar */}
          <div className="w-80 discord-bg-darker p-6">
            <h3 className="discord-text-white font-semibold mb-4">Active Now</h3>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎮</div>
              <p className="discord-text text-sm">
                It's quiet for now...<br/>
                When a friend starts an activity—like playing a game or hanging out on voice—we'll show it here!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showProfileModal && (
        <ProfileModal
          user={currentUser}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {showAddFriendModal && (
        <AddFriendModal
          user={currentUser}
          onClose={() => setShowAddFriendModal(false)}
        />
      )}
    </div>
  );
}
