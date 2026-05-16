const reviews = [
  {
    rating: 5,
    text: "The quality is unreal. You can feel the weight of the fabric the moment you put it on. Definitely worth every rupee.",
    author: "Arjun M.",
  },
  {
    rating: 5,
    text: "Finally a brand that gets the aesthetic right. Fits perfect, looks even better in person. Already copped three pieces.",
    author: "Rohan K.",
  },
  {
    rating: 5,
    text: "Been wearing the waffle tee for a month now — no pilling, no fading. This is how streetwear should be made.",
    author: "Priya S.",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="review-rating">
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function ReviewsSection() {
  return (
    <section className="reviews-section">
      <h2 className="reviews-title">What People Are Saying</h2>
      <div className="reviews-grid">
        {reviews.map((review, i) => (
          <div key={i} className="review-card">
            <StarRating count={review.rating} />
            <p className="review-text">{review.text}</p>
            <p className="author-name">{review.author}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
