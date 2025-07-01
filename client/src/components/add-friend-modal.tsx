import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addFriendSchema, type AddFriend, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

interface AddFriendModalProps {
  user: User;
  onClose: () => void;
}

export default function AddFriendModal({ user, onClose }: AddFriendModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddFriend>({
    resolver: zodResolver(addFriendSchema),
    defaultValues: {
      friendCode: "",
    },
  });

  const addFriendMutation = useMutation({
    mutationFn: async (data: AddFriend) => {
      const response = await apiRequest("POST", `/api/user/${user.id}/friends`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user.id}/friends`] });
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send friend request",
        description: error.message || "Unable to send friend request",
        variant: "destructive",
      });
    },
  });

  const generateFriendCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/user/${user.id}/friend-code`, {});
      return response.json();
    },
    onSuccess: (data) => {
      const updatedUser = { ...user, friendCode: data.friendCode };
      auth.setCurrentUser(updatedUser);
      toast({
        title: "Friend code generated",
        description: "Your new friend code has been generated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate friend code",
        description: error.message || "Unable to generate new friend code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddFriend) => {
    addFriendMutation.mutate(data);
  };

  const currentUser = auth.getCurrentUser();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="discord-bg-dark border-[hsl(221,8%,13%)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="discord-text-white text-lg font-semibold">Add Friend</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <p className="discord-text text-sm">
            You can add friends with their Discord username or friend code.
          </p>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="friendCode"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input 
                        {...field}
                        className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                        placeholder="Enter username#0000 or friend code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="discord-bg-darker p-3 rounded mb-2">
                <div className="discord-text text-sm mb-1">Your Friend Code:</div>
                <div className="discord-text-white font-mono text-lg">
                  {currentUser?.friendCode || user.friendCode}
                </div>
              </div>
              
              <Button 
                type="button"
                variant="link"
                onClick={() => generateFriendCodeMutation.mutate()}
                className="text-[hsl(235,86%,65%)] hover:underline p-0 h-auto text-sm"
                disabled={generateFriendCodeMutation.isPending}
              >
                {generateFriendCodeMutation.isPending ? "Generating..." : "Generate New Code"}
              </Button>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="discord-text hover:discord-text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="discord-primary discord-primary-hover text-white"
                  disabled={addFriendMutation.isPending}
                >
                  {addFriendMutation.isPending ? "Sending..." : "Send Friend Request"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
