import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Star, AlertTriangle, MessageSquare, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface WorkflowRatingsProps {
  workflowId: number;
}

interface Rating {
  userId: number;
  rating: number;
  review?: string;
  createdAt: string;
}

export default function WorkflowRatings({ workflowId }: WorkflowRatingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  // Fetch ratings
  const { data: ratings, isLoading, error } = useQuery<Rating[]>({
    queryKey: [`/api/workflows/${workflowId}/ratings`],
  });

  // Submit rating mutation
  const submitRating = useMutation({
    mutationFn: async (data: { rating: number; review?: string }) => {
      const res = await apiRequest(
        "POST", 
        `/api/workflows/${workflowId}/ratings`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Rating Submitted",
        description: "Thank you for your feedback!"
      });
      setUserRating(0);
      setUserReview("");
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/ratings`] });
      // Also invalidate the workflow to update the average rating
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive"
      });
    }
  });

  // Handle submit
  const handleSubmit = () => {
    if (userRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting",
        variant: "destructive"
      });
      return;
    }
    
    submitRating.mutate({
      rating: userRating,
      review: userReview.trim() || undefined
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error Loading Ratings
          </CardTitle>
          <CardDescription>
            There was a problem loading the ratings. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Get user initials for avatar
  const getUserInitials = (userId: number) => {
    return `U${userId}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold flex items-center">
        <MessageSquare className="h-5 w-5 mr-2" />
        Ratings & Reviews
      </h2>

      {/* Submit rating form */}
      {user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leave Your Rating</CardTitle>
            <CardDescription>
              Share your experience with this workflow to help others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="rating" className="block mb-2">Rating</Label>
              <div className="flex gap-1" id="rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none"
                    aria-label={`Rate ${star} stars`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= (hoveredRating || userRating)
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {userRating > 0 ? `${userRating} star${userRating !== 1 ? 's' : ''}` : 'Select rating'}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="review" className="block mb-2">Review (Optional)</Label>
              <Textarea
                id="review"
                placeholder="Share your thoughts about this workflow..."
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                className="resize-none min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleSubmit}
              disabled={submitRating.isPending}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitRating.isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Sign in to Rate</CardTitle>
            <CardDescription>
              You need to be signed in to rate and review this workflow
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" asChild>
              <a href="/auth">Sign in</a>
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Existing ratings */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium">User Reviews</h3>
        
        {ratings && ratings.length === 0 ? (
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">No Reviews Yet</CardTitle>
              <CardDescription>
                Be the first to review this workflow!
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-4">
            {ratings?.map((rating, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarFallback>
                          {getUserInitials(rating.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm">User {rating.userId}</CardTitle>
                        <CardDescription className="text-xs">
                          {format(new Date(rating.createdAt), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Star 
                          key={i} 
                          className="h-4 w-4" 
                          fill={i < rating.rating ? "#f59e0b" : "none"}
                          stroke={i < rating.rating ? "#f59e0b" : "currentColor"}
                        />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                {rating.review && (
                  <CardContent className="pt-0">
                    <p className="text-sm">{rating.review}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}