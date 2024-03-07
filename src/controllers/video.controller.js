import mongoose from "mongoose"
import { asyncHandler } from "../utility/asyncHandler.js"
import Video from 'video.controller.js'
import { ThrowError } from "../utility/ThrowError.js";
import { uploadCloudinary } from "../services/cloudinary.js";


// controller for get all videos from searchbar or query
const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Parse page and limit to integers
    page = parseInt(page);
    limit = parseInt(limit);

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Construct filter object
    const filter = {};
    if (query) {
        filter.title = { $regex: query, $options: 'i' }; // Corrected option to $options
    }
    if (userId) {
        filter.owner = userId; // Changed userId to owner as per schema
    }

    // Construct sort object
    const sort = {};
    if (sortBy && sortType) {
        sort[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    try {
        // Fetch videos
        const videos = await Video.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate('owner', 'userName fullName avatar'); // Populate owner details

        return res
            .status(200)
            .json(
                new Response(200, videos, 'Videos fetched successfully')
            )
    } catch (error) {
        throw new ThrowError(500, 'Error fetching videos' || error?.message)
    }
});

// controller for publishing a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ThrowError(400, 'title and description is required');
    }
    if (!req.file) {
        throw new ThrowError(400, 'video file is required');
    }

    videoFileLocalPath = req.files?.video[0]?.path;
    if (!videoFileLocalPath) {
        throw new ThrowError(400, 'video file is required')
    }
    const uploadVideo = await uploadCloudinary(videoFileLocalPath);

    if (!uploadVideo) {
        throw new ThrowError(400, 'error while uploading video')
    }

    thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if (!thumbnailLocalPath) {
        throw new ThrowError(400, 'thumbnail is required')
    }

    const uploadThumbnail = await uploadCloudinary(thumbnailLocalPath)

    if (!uploadThumbnail) {
        throw new ThrowError(400, 'error while uploading thumbnail')
    }

    try {
        const video = await Video.create({
            videoFile: uploadVideo.url,
            thumbnail: uploadThumbnail.url,
            title
        })
        return res
            .status(200)
            .json(
                new Response(200, video, 'video upload successfully')
            )
    } catch (error) {
        throw new ThrowError(500, error?.message || 'err0r while uploading video')
    }
})



// get a single video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    try {
        const video = await Video.findById(videoId).populate('owner', 'userName  fullName avatar')

        if (!video) {
            throw new ThrowError(400, 'video not found');
        }

        //if video exist return the video
        return res
            .status(200)
            .json(
                new Response(200, video, 'video found successfully')
            )
    } catch (error) {
        throw new ThrowError(500, error?.message || 'error while getting single video getvideobyid')
    }
})



const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { title, description } = req.body;

    try {

        thumbnailLocalPath = req.files?.thumbnail[0]?.path;
        if (!thumbnailLocalPath) {
            throw new ThrowError(400, 'thumbnail is required')
        }

        const uploadThumbnail = await uploadCloudinary(thumbnailLocalPath)

        if (!uploadThumbnail) {
            throw new ThrowError(400, 'error while uploading thumbnail')
        }

        const video = await Video.findByIdAndUpdate(
            videoId,
            {
                $set: {
                    title,
                    description,
                    thumbnail: uploadThumbnail?.url
                }
            },
            {
                new: true
            }
        )

        if (!video) {
            throw new ThrowError(400, 'video not found => updatevideo')
        }

        return res
            .status(200)
            .json(
                new Response(200, video, 'video updated successfully')
            )
    } catch (error) {
        throw new ThrowError(500, error?.message || 'error while updateing video')
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ThrowError(400, 'video not found')
        }

        await video.remove();

        return res
            .status(200)
            .json(
                new Response(200, 'video deleted successfully')
            )
    } catch (error) {
        throw new ThrowError(500, error?.message || 'error while deleting video')
    }
})



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            throw new ThrowError(400, 'video not found')
        }

        video.isPublished = !video.isPublished;
        await video.save();

        return res
            .status(200)
            .json(
                new Response(200, video, `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`)
            )
    } catch (error) {
        throw new ThrowError(500, 'error while publishing/toggling a video')
    }

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
