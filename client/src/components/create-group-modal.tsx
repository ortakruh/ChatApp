
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CreateGroupModalProps {
  user: User;
  onClose: () => void;
}

export default function CreateGroupModal({ user, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery<(User & { status: string })[]>({
    queryKey: ["/api/user/" + user.id + "/friends"],
    enabled: !!user,
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/groups", { name, description });
      return response.json();
    },
    onSuccess: async (group) => {
      // Add selected friends to the group
      for (const friendId of selectedFriends) {
        await apiRequest("POST", `/api/groups/${group.id}/members`, { userId: friendId });
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user.id}/groups`] });
      toast({
        title: "Group created",
        description: "Your group has been created successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    
    createGroupMutation.mutate({
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
    });
  };

  const toggleFriend = (friendId: number) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="discord-bg-dark max-w-md">
        <DialogHeader>
          <DialogTitle className="discord-text-white">Create Group</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="discord-text text-sm font-medium">Group Name</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="discord-bg-darker border-gray-600 discord-text-white mt-1"
              required
            />
          </div>
          
          <div>
            <label className="discord-text text-sm font-medium">Description (Optional)</label>
            <Textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description"
              className="discord-bg-darker border-gray-600 discord-text-white mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <label className="discord-text text-sm font-medium mb-2 block">
              Add Friends ({selectedFriends.length} selected)
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {acceptedFriends.length === 0 ? (
                <p className="discord-text text-sm">No friends to add</p>
              ) : (
                acceptedFriends.map((friend) => (
                  <div 
                    key={friend.id}
                    className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                      selectedFriends.includes(friend.id) 
                        ? 'discord-bg-darker border border-blue-500' 
                        : 'hover:discord-bg-darker'
                    }`}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarImage src={friend.avatar || undefined} />
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {friend.displayName?.[0] || friend.username[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="discord-text-white text-sm">
                      {friend.displayName || friend.username}
                    </span>
                    {selectedFriends.includes(friend.id) && (
                      <svg className="w-4 h-4 text-blue-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 discord-text hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!groupName.trim() || createGroupMutation.isPending}
              className="flex-1 discord-green text-white"
            >
              {createGroupMutation.isPending ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
