export const bidInBioId = '17841437410548004'
export const fakeClientId = '17841421692843222'
export const media = {
  caption: '@bidin.bio',
  comments: { 
    data: [
      {
        timestamp: "2020-07-04T17:51:53+0000",
        text: "First",
        id: "17873438008770562"
      }
    ]
  },
  like_count: 0,
  permalink: 'https://www.instagram.com/p/CBQ196wIABy/',
  media_url: 'https://scontent.cdninstagram.com/v/t51.2885-15/103146925_891986667969890_3587098413369820546_n.jpg?_nc_cat=101&_nc_sid=8ae9d6&_nc_ohc=K6jQQz49VOQAX8bBp2-&_nc_ht=scontent.cdninstagram.com&oh=34ca3aa4b58b3f242390f02ef0dfad30&oe=5F240BFB',
  media_type: 'IMAGE',
  username: 'mybidbot',
  owner: { 
    id: '17841421692843222'
  },
  id: '17882167429630425'
};

export const comment = {
  field: "comments",
  value: {
    id: "17849378825146412",
    text: "@bidin.bio 🔥🔥🔥"
  }
}

export const mentions = {
  comment: {
    field: "mentions",
    value: {
      comment_id: "17849378825146412",
      media_id: "17882167429630425",
    }
  },
  caption: {
    field: "mentions",
    value: {
      media_id: "17927762023405919"
    }
  }
}

const commentHook = {
  object: "instagram",
  entry: [
    {
      id: '17882167429630425',
      time: 1593817668,
      changes: [
        {
          field: "comments",
          value: {
            id: "17865799348089039",
            text: "This is an example."
          }
        }
      ]
    }
  ]
}

export const auctionMessages = [
  {
    text: "100",
    id: "17899075582513831"
  },
];
