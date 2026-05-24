'use client';

import ReviewsSection from "@/components/sections/home/ReviewsSection";

interface CMSTestimonial {
  author?: string;
  comment?: string;
  rating?: number;
}

interface CMSReviewsContent {
  schema_version?: string;
  heading?: string;
  testimonials?: CMSTestimonial[];
}

interface CMSReviewsWrapperProps {
  content: CMSReviewsContent;
}

export default function CMSReviewsWrapper({ content }: CMSReviewsWrapperProps) {
  // Map testimonials "comment" to ReviewsSection "text" prop contract
  const mappedReviews = content.testimonials?.map((t, idx) => ({
    text: t.comment || "",
    author: t.author || "Anonymous"
  }));

  return (
    <ReviewsSection
      heading={content.heading}
      reviews={mappedReviews}
    />
  );
}
