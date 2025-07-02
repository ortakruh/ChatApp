import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { auth } from "@/lib/auth";
import { User, DirectMessage, VoiceCallData } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProfileModal from "@/components/profile-modal";
import AddFriendModal from "@/components/add-friend-modal";

export default function ChatPage() {
  const [, navigate] = useLocation();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isInVoiceCall, setIsInVoiceCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<VoiceCallData | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
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

  // Get messages for selected friend
  const { data: messages = [] } = useQuery<DirectMessage[]>({
    queryKey: ["/api/messages", currentUser?.id, selectedFriend?.id],
    enabled: !!currentUser && !!selectedFriend,
    refetchInterval: 1000, // Real-time message updates
  });

  // WebSocket connection for real-time features
  useEffect(() => {
    if (!currentUser) return;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        ws.send(JSON.stringify({ type: 'auth', userId: currentUser.id }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'new_message':
              // Refresh messages when new message received
              queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
              break;

            case 'voice_call_action':
              if (data.action === 'start') {
                setIncomingCall(data);
              } else if (data.action === 'accept') {
                setIsInVoiceCall(true);
                startVoiceCall(data.fromUserId);
              } else if (data.action === 'reject' || data.action === 'end') {
                setIsInVoiceCall(false);
                setIncomingCall(null);
                endVoiceCall();
              }
              break;

            case 'voice_call_signal':
              handleVoiceSignal(data.signal, data.fromUserId);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, attempting to reconnect...");
        setTimeout(connectWebSocket, 3000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser, queryClient]);

  // Voice call functions
  const startVoiceCall = async (targetUserId: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      peerConnection.ontrack = (event) => {
        remoteStreamRef.current = event.streams[0];
        const audioElement = document.getElementById('remoteAudio') as HTMLAudioElement;
        if (audioElement) {
          audioElement.srcObject = event.streams[0];
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_call_signal',
            targetUserId,
            signal: { type: 'ice-candidate', candidate: event.candidate }
          }));
        }
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'voice_call_signal',
          targetUserId,
          signal: { type: 'offer', offer }
        }));
      }

      peerConnectionRef.current = peerConnection;
      setIsInVoiceCall(true);
    } catch (error) {
      console.error('Error starting voice call:', error);
      toast({
        title: "Error",
        description: "Could not start voice call. Check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleVoiceSignal = async (signal: any, fromUserId: number) => {
    if (!peerConnectionRef.current) return;

    try {
      if (signal.type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(signal.offer);
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'voice_call_signal',
            targetUserId: fromUserId,
            signal: { type: 'answer', answer }
          }));
        }
      } else if (signal.type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(signal.answer);
      } else if (signal.type === 'ice-candidate') {
        await peerConnectionRef.current.addIceCandidate(signal.candidate);
      }
    } catch (error) {
      console.error('Error handling voice signal:', error);
    }
  };

  const endVoiceCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsInVoiceCall(false);
    setIncomingCall(null);
  };

  const initiateVoiceCall = (friendId: number) => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'voice_call_action',
        action: 'start',
        targetId: friendId
      }));
      startVoiceCall(friendId);
    }
  };

  // Messaging functions
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedFriend || !currentUser) return;

    try {
      console.log('Sending message:', {
        senderId: currentUser.id,
        receiverId: selectedFriend.id,
        message: messageText.trim()
      });

      // Send via API first
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id.toString(),
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: selectedFriend.id,
          message: messageText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }

      const sentMessage = await response.json();
      console.log('Message sent successfully:', sentMessage);

      // Send via WebSocket for real-time delivery
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'message',
          receiverId: selectedFriend.id,
          messageText: messageText.trim()
        }));
      }

      setMessageText("");

      // Refresh messages immediately
      queryClient.invalidateQueries({ 
        queryKey: ["/api/messages", currentUser.id, selectedFriend.id] 
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Could not send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-60 bg-gray-800 flex flex-col">
        {/* Server/DM Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-semibold">Messages</h2>
            <Button variant="ghost" size="sm" className="discord-text hover:discord-text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
              </svg>
            </Button>
          </div>
        </div>

        {/* Friends/DM List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
              <span className="text-gray-300">Friends</span>
            </div>
            <div className="flex items-center px-2 py-2 rounded hover:bg-gray-700 cursor-pointer">
              <svg className="w-5 h-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              <span className="text-gray-300">Library</span>
            </div>
          </div>

          <div className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs font-semibold uppercase">Direct Messages</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-400 hover:text-white"
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
                <div 
                  key={friend.id} 
                  className="flex items-center px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedFriend(friend)}
                >
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={friend.avatar || undefined} />
                    <AvatarFallback className="bg-blue-500 text-white text-xs">
                      {friend.displayName?.[0] || friend.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-300 text-sm">{friend.displayName || friend.username}</span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Area */}
        <div className="p-2 bg-gray-900">
          <div className="flex items-center">
            <Avatar 
              className="w-8 h-8 mr-3 cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
              <AvatarImage src={currentUser.avatar || undefined} />
              <AvatarFallback className="bg-blue-500 text-white">
                {currentUser.displayName?.[0] || currentUser.username[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-white text-sm font-medium">
                {currentUser.displayName || currentUser.username}
              </div>
              <div className="text-gray-400 text-xs">#{currentUser.friendCode?.split('#')[1] || '1234'}</div>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white p-1">
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
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {selectedFriend ? (
                <>
                  <Avatar className="w-8 h-8 mr-3">
                    <AvatarImage src={selectedFriend.avatar || undefined} />
                    <AvatarFallback className="bg-blue-500 text-white">
                      {selectedFriend.displayName?.[0] || selectedFriend.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white font-semibold">
                    {selectedFriend.displayName || selectedFriend.username}
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                  <span className="text-white font-semibold">Friends</span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {selectedFriend && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`${isInVoiceCall ? 'discord-green' : 'discord-text hover:discord-text-white'}`}
                    onClick={() => isInVoiceCall ? endVoiceCall() : initiateVoiceCall(selectedFriend.id)}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                    </svg>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="discord-text hover:discord-text-white"
                    onClick={() => setSelectedFriend(null)}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {selectedFriend ? (
            /* Messaging Interface */
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="discord-text text-sm">
                      Start a conversation with {selectedFriend.displayName || selectedFriend.username}!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className={`flex ${message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser?.id 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-white'
                      }`}>
                        <p className="text-sm">{message.message}</p>
                        <p className="text-xs opacity-75 mt-1">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-700">
                <div className="flex space-x-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedFriend.displayName || selectedFriend.username}`}
                    className="flex-1 bg-gray-700 border-none text-white placeholder:text-gray-400"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!messageText.trim()}
                    className="bg-blue-600 text-white px-4 hover:bg-blue-700"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Friends Interface */
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
          )}
        </div>

        {/* Hidden audio element for voice calls */}
        <audio id="remoteAudio" autoPlay style={{ display: 'none' }}></audio>
      </div>

      {/* Voice Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="discord-bg-dark p-6 rounded-lg">
            <h3 className="discord-text-white text-lg font-semibold mb-4">
              Incoming Voice Call
            </h3>
            <p className="discord-text mb-6">
              {friends.find(f => f.id === incomingCall.callerId)?.displayName || 
               friends.find(f => f.id === incomingCall.callerId)?.username} is calling you.
            </p>
            <div className="flex space-x-4">
              <Button 
                onClick={() => {
                  if (wsRef.current) {
                    wsRef.current.send(JSON.stringify({
                      type: 'voice_call_action',
                      action: 'accept',
                      targetId: incomingCall.callerId
                    }));
                  }
                  setIncomingCall(null);
                }}
                className="discord-green text-white"
              >
                Accept
              </Button>
              <Button 
                onClick={() => {
                  if (wsRef.current) {
                    wsRef.current.send(JSON.stringify({
                      type: 'voice_call_action',
                      action: 'reject',
                      targetId: incomingCall.callerId
                    }));
                  }
                  setIncomingCall(null);
                }}
                variant="outline"
                className="border-gray-500 text-gray-300"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      )}

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