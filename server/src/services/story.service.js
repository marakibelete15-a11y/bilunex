const storyRepository = require('../repositories/story.repository');
const auditLogRepository = require('../repositories/audit_log.repository');
const logger = require('../utils/logger');

const sanitize = value => value.replace(/<[^>]*>/g, '').trim();
const storyService = {
  async submit(data) {
    const safeData = {
      ...data,
      full_name: sanitize(data.full_name),
      title: sanitize(data.title),
      body: sanitize(data.body),
    };
    return storyRepository.create(safeData);
  },
  async listPublic({ page, limit }) {
    const offset = (page - 1) * limit;
    const [stories, total] = await Promise.all([
      storyRepository.findPublic({ limit, offset }),
      storyRepository.countPublic(),
    ]);
    return {
      stories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  },
  async listAdmin({ status, page, limit }) {
    const offset = (page - 1) * limit;
    const [stories, total] = await Promise.all([
      storyRepository.findAll({ status, limit, offset }),
      storyRepository.countAll(status),
    ]);
    return {
      stories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  },
  async getAdmin({ id, adminUser, ip }) {
    const story = await storyRepository.findById(id);
    if (story) {
      try {
        await auditLogRepository.create({
          actor_type: 'admin',
          actor_id: Number(adminUser.id),
          actor_email: adminUser.email,
          action: 'view',
          target_table: 'stories',
          target_id: Number(id),
          metadata: { ip },
        });
      } catch (error) {
        logger.error('Failed to record story view audit:', error.message);
      }
    }
    return story;
  },
  async updateStatus({ id, status, adminUser, ip }) {
    const updated = await storyRepository.updateStatus(id, status, adminUser.id);
    if (updated) {
      try {
        await auditLogRepository.create({
          actor_type: 'admin',
          actor_id: Number(adminUser.id),
          actor_email: adminUser.email,
          action: 'update',
          target_table: 'stories',
          target_id: Number(id),
          metadata: { status, ip },
        });
      } catch (error) {
        logger.error('Failed to record story moderation audit:', error.message);
      }
    }
    return updated;
  },
};
module.exports = storyService;
