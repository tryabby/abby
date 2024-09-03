-- @param {String} $1:testId
-- @param {Int} $2:type
-- @param {String} $3:testIdAgain
-- @param {Int} $4:typeAgain

SELECT
	COUNT(DISTINCT CASE WHEN anonymousId IS NOT NULL THEN
			anonymousId
		ELSE
			CONCAT('NULL_', UUID())
		END) AS uniqueEventCount,
	COUNT(*) AS eventCount,
	TYPE,
	createdAt,
	selectedVariant
FROM
	`Event`
WHERE
	testId = ?
	AND TYPE = ?
	AND(DATE(createdAt) BETWEEN DATE((
			SELECT
				MIN(createdAt)
				FROM `Event`
			WHERE
				testId = ?
				AND TYPE = ?))
		AND DATE(NOW()))
GROUP BY
	DATE(createdAt), selectedVariant
ORDER BY createdAt ASC;