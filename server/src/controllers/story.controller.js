const storyService = require('../services/story.service');
const notificationService = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/response');
const logger = require('../utils/logger');
const storyController = {
  async submit(req, res, next) {
    try {
      if (req.body.website)
        return sendSuccess(res, { id: 'received' }, 'Story received for review', 201);
      const story = await storyService.submit(req.body);
      sendSuccess(res, { id: story.id, status: story.status }, 'Story received for review', 201);
      res.once('finish', () =>
        notificationService
          .notifyStorySubmitted(story)
          .catch(error => logger.error('Story alert failed:', error.message))
      );
    } catch (error) {
      next(error);
    }
  },
  async publicList(req, res, next) {
    try {
      return sendSuccess(
        res,
        await storyService.listPublic(req.query),
        'Published stories retrieved',
        200
      );
    } catch (error) {
      next(error);
    }
  },
  async adminList(req, res, next) {
    try {
      return sendSuccess(res, await storyService.listAdmin(req.query), 'Stories retrieved', 200);
    } catch (error) {
      next(error);
    }
  },
  async adminGet(req, res, next) {
    try {
      const story = await storyService.getAdmin({
        id: req.params.id,
        adminUser: req.user,
        ip: req.ip,
      });
      if (!story) return sendError(res, 'Story not found', 404);
      return sendSuccess(res, story, 'Story retrieved', 200);
    } catch (error) {
      next(error);
    }
  },
  async moderate(req, res, next) {
    try {
      const story = await storyService.updateStatus({
        ...req.params,
        ...req.body,
        adminUser: req.user,
        ip: req.ip,
      });
      if (!story) return sendError(res, 'Story not found', 404);
      return sendSuccess(res, story, `Story moved to ${story.status}`, 200);
    } catch (error) {
      next(error);
    }
  },
};
module.exports = storyController;
