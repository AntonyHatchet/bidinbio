interface CommentHook {
  id: string;
  text: string;
}

interface MentionsHook {
  media_id: string;
  comment_id: string;
}


interface StoryInsightsHook {
  media_id: string;
  impressions: number;
  reach: number;
  taps_forward: number;
  taps_back: number;
  exits: number;
  replies: number;
}
export const handleCommentsHook = async (data: CommentHook) => {
  console.log({data})
  const isBidLike = checkCommentForPattern(data.text);
  console.log(isBidLike)
}
export const handleMentionsHook = async (data: MentionsHook) => {

  console.log(data.entry)
}

export const handleStoryInsightsHook = async (data: StoryInsightsHook) => {
  console.log({data})
}

// private 

function checkCommentForPattern(comment: string) {
  const pattern = /^[0-9]*$/;
  return pattern.test(comment);
}