import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfileSchema, type UpdateProfile, type User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/auth";

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

export default function ProfileModal({ user, onClose }: ProfileModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user.displayName || "",
      about: user.about || "",
      avatar: user.avatar || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await apiRequest("PATCH", `/api/user/${user.id}`, data);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      auth.setCurrentUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user.id}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  const changeAvatar = () => {
    // Cycle through different avatar options
    const avatars = [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
      'https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
    ];
    
    const currentAvatar = form.getValues('avatar');
    const currentIndex = avatars.indexOf(currentAvatar || '');
    const nextIndex = (currentIndex + 1) % avatars.length;
    form.setValue('avatar', avatars[nextIndex]);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="discord-bg-dark border-[hsl(221,8%,13%)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="discord-text-white text-lg font-semibold">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={form.watch('avatar') || undefined} />
                <AvatarFallback className="bg-[hsl(235,86%,65%)] text-white text-xl">
                  {form.watch('displayName')?.[0] || user.username[0]}
                </AvatarFallback>
              </Avatar>
              <Button 
                type="button"
                onClick={changeAvatar}
                className="discord-primary discord-primary-hover text-white px-4 py-2 rounded text-sm"
              >
                Change Avatar
              </Button>
            </div>
            
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="discord-text text-sm font-medium">Display Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      value={field.value || ""}
                      className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)]" 
                      placeholder="Enter display name"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="discord-text text-sm font-medium">About Me</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      value={field.value || ""}
                      className="discord-bg-darker discord-text-white border-0 focus:ring-2 focus:ring-[hsl(235,86%,65%)] h-20 resize-none" 
                      placeholder="Tell us about yourself..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-3">
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
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
