-- @param {String} $1:testId
-- @param {Int} $2:type
SELECT
	COUNT(*) AS eventCount,
	TYPE,
	createdAt,
	selectedVariant
FROM
	`Event`
WHERE
	testId = ?
	AND TYPE = ?
	AND DATE(NOW()) - INTERVAL 1 MONTH
GROUP BY
	DATE(createdAt),
	selectedVariant