const Post = require('../models/Posts');
const mongoose = require('mongoose');

const getpostsPipeline = (query,viewerUserName,offset,limit)=>{

  limit = (!limit || limit>30) ? +30 : +limit; // validating the limit value
  offset = (!offset || offset <=0 )? 0 : +offset;  
  console.log(`===>${(!offset)?  0 :(offset-1)*limit}`);
  console.log(viewerUserName);
  return [
    
    {
      $match: (query)? query : {}
    }
    ,
    {
      $lookup: {
        from: 'users',
        localField: 'publisher',
        foreignField: 'userName',
        pipeline: [
          { $project: { userName: 1, firstName: 1, lastName: 1, imgURL: 1 } },
        ],
        as: 'publisherData',
      },
    },
    
    {
      $addFields: {
        userReact: {
          $arrayElemAt: [
            {
              $map: {
                input: {
                  $filter: {
                    input: '$reacts',
                    as: 'react',
                    cond: { $eq: ['$$react.publisher', viewerUserName || ''] },
                  },
                },
                as: 'react',
                in: '$$react.reactType',
              },
            },
            0,
          ],
        }
      },
    },
    
    {
      $project: {
        _id: 1,
        caption: 1,
        mediaURL: 1,
        postPoints: 1,
        publishDate: 1,
        publisherData: { $arrayElemAt: ["$publisherData", 0] },
        userReact: 1
       

      },
    },

    {
      $sort: {
        "publishDate": -1
      }
    },
    {
      $skip: (!offset)?  0 :(offset-1)*limit
    },

    {
      $limit: limit
    }
  ]
  
}

module.exports.getPosts = async (query,viewerUserName,offset,limit)=>{

console.log(`querried post with querry : {${query} and requester: ${viewerUserName}}`);

  const posts = await Post.aggregate(getpostsPipeline(query,viewerUserName,offset,limit));
  return posts;
}

